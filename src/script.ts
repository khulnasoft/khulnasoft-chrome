import type { JupyterFrontEnd } from '@jupyterlab/application';
import type * as monaco from 'monaco-editor';

import { addListeners } from './codemirror';
import { CodeMirrorState } from './codemirrorInject';
import { JupyterNotebookKeyBindings } from './common';
import { inject as jupyterInject } from './jupyterInject';
import { getPlugin } from './jupyterlabPlugin';
import { MonacoCompletionProvider, MonacoSite, OMonacoSite } from './monacoCompletionProvider';

declare type Monaco = typeof import('monaco-editor');
declare type CodeMirror = typeof import('codemirror');

const params = new URLSearchParams((document.currentScript as HTMLScriptElement).src.split('?')[1]);
const extensionId = params.get('id')!;

async function getAllowedAndKeybindings(
  extensionId: string
): Promise<{ allowed: boolean; keyBindings: JupyterNotebookKeyBindings }> {
  const result = await new Promise<{ allowed: any; keyBindings: JupyterNotebookKeyBindings }>(
    (resolve) => {
      chrome.runtime.sendMessage(
        extensionId,
        { type: 'jupyter_notebook_allowed_and_keybindings' },
        (response: { allowed: boolean; keyBindings: JupyterNotebookKeyBindings }) => {
          resolve(response);
        }
      );
    }
  );
  return result;
}

async function getDebounceMs(extensionId: string): Promise<{ debounceMs: number }> {
  const result = await new Promise<{ debounceMs: number }>((resolve) => {
    chrome.runtime.sendMessage(
      extensionId,
      { type: 'debounce_ms' },
      (response: { debounceMs: number }) => {
        resolve(response);
      }
    );
  });
  return result;
}

// Clear any bad state from another tab.
void chrome.runtime.sendMessage(extensionId, { type: 'success' });

const SUPPORTED_MONACO_SITES = new Map<RegExp, MonacoSite>([
  [/https:\/\/colab.research\.google\.com\/.*/, OMonacoSite.COLAB],
  [/https:\/\/(.*\.)?stackblitz\.com\/.*/, OMonacoSite.STACKBLITZ],
  [/https:\/\/(.*\.)?deepnote\.com\/.*/, OMonacoSite.DEEPNOTE],
  [/https:\/\/(.*\.)?(databricks\.com|azuredatabricks\.net)\/.*/, OMonacoSite.DATABRICKS],
  [/https:\/\/(.*\.)?quadratichq\.com\/.*/, OMonacoSite.QUADRATIC],
]);

declare global {
  interface Window {
    _monaco?: Monaco;
    _MonacoEnvironment?: monaco.Environment;
  }
}

// Intercept creation of monaco so we don't have to worry about timing the injection.
const addMonacoInject = (debounceMs: number) =>
  Object.defineProperties(window, {
    MonacoEnvironment: {
      get() {
        if (this._khulnasoft_MonacoEnvironment === undefined) {
          this._khulnasoft_MonacoEnvironment = { globalAPI: true };
        }
        return this._khulnasoft_MonacoEnvironment;
      },
      set(env: monaco.Environment | undefined) {
        if (env !== undefined) {
          env.globalAPI = true;
        }
        this._khulnasoft_MonacoEnvironment = env;
      },
    },
    monaco: {
      get(): Monaco | undefined {
        return this._khulnasoft_monaco;
      },
      set(_monaco: Monaco) {
        let injectMonaco: MonacoSite = OMonacoSite.CUSTOM;
        for (const [sitePattern, site] of SUPPORTED_MONACO_SITES) {
          if (sitePattern.test(window.location.href)) {
            injectMonaco = site;
            break;
          }
        }
        this._khulnasoft_monaco = _monaco;
        const completionProvider = new MonacoCompletionProvider(
          extensionId,
          injectMonaco,
          debounceMs
        );
        if (!_monaco?.languages?.registerInlineCompletionsProvider) {
          return;
        }
        setTimeout(() => {
          _monaco.languages.registerInlineCompletionsProvider(
            { pattern: '**' },
            completionProvider
          );
          _monaco.editor.registerCommand(
            'khulnasoft.acceptCompletion',
            (_: unknown, apiKey: string, completionId: string, callback?: () => void) => {
              callback?.();
              completionProvider.acceptedLastCompletion(completionId).catch((e) => {
                console.error(e);
              });
            }
          );
          _monaco.editor.onDidCreateEditor((editor: monaco.editor.ICodeEditor) => {
            completionProvider.addEditor(editor);
          });
          console.log('Khulnasoft: Activated Monaco');
        });
      },
    },
  });

let injectCodeMirror = false;

const addJupyterLabInject = (jupyterConfigDataElement: HTMLElement, debounceMs: number) => {
  const config = JSON.parse(jupyterConfigDataElement.innerText);
  config.exposeAppInBrowser = true;
  jupyterConfigDataElement.innerText = JSON.stringify(config);
  injectCodeMirror = true;
  Object.defineProperty(window, 'jupyterapp', {
    get: function () {
      return this._khulnasoft_jupyterapp;
    },
    set: function (_jupyterapp?: JupyterFrontEnd) {
      if (_jupyterapp?.version.startsWith('3.')) {
        const p = getPlugin(extensionId, _jupyterapp, debounceMs);
        _jupyterapp.registerPlugin(p);
        _jupyterapp.activatePlugin(p.id).then(
          () => {
            console.log('Khulnasoft: Activated JupyterLab 3.x');
          },
          (e) => {
            console.error(e);
          }
        );
      } else if (_jupyterapp?.version.startsWith('4.')) {
        void chrome.runtime.sendMessage(extensionId, {
          type: 'error',
          message:
            'Only JupyterLab 3.x is supported. Use the khulnasoft-jupyter extension for JupyterLab 4',
        });
      } else {
        void chrome.runtime.sendMessage(extensionId, {
          type: 'error',
          message: `Khulnasoft: Unexpected JupyterLab version: ${
            _jupyterapp?.version ?? '(unknown)'
          }. Only JupyterLab 3.x is supported`,
        });
      }
      this._khulnasoft_jupyterapp = _jupyterapp;
    },
  });
  Object.defineProperty(window, 'jupyterlab', {
    get: function () {
      return this._khulnasoft_jupyterlab;
    },
    set: function (_jupyterlab?: JupyterFrontEnd) {
      if (_jupyterlab?.version.startsWith('2.')) {
        const p = getPlugin(extensionId, _jupyterlab, debounceMs);
        _jupyterlab.registerPlugin(p);
        _jupyterlab.activatePlugin(p.id).then(
          () => {
            console.log('Khulnasoft: Activated JupyterLab 2.x');
          },
          (e) => {
            console.error(e);
          }
        );
      }
      this._khulnasoft_jupyterlab = _jupyterlab;
    },
  });
};

const SUPPORTED_CODEMIRROR_SITES = [
  { name: 'JSFiddle', pattern: /https?:\/\/(.*\.)?jsfiddle\.net(\/.*)?/, multiplayer: false },
  { name: 'CodePen', pattern: /https:\/\/(.*\.)?codepen\.io(\/.*)?/, multiplayer: false },
  { name: 'CodeShare', pattern: /https:\/\/(.*\.)?codeshare\.io(\/.*)?/, multiplayer: true },
];

const addCodeMirror5GlobalInject = (
  keybindings: JupyterNotebookKeyBindings | undefined,
  debounceMs: number
) =>
  Object.defineProperty(window, 'CodeMirror', {
    get: function () {
      return this._khulnasoft_CodeMirror;
    },
    set: function (cm?: { version?: string }) {
      this._khulnasoft_CodeMirror = cm;
      if (injectCodeMirror) {
        return;
      }
      if (!cm?.version?.startsWith('5.')) {
        console.warn("Khulnasoft: Khulnasoft doesn't support CodeMirror 6");
        return;
      }
      // We rely on the fact that the Jupyter variable is defined first.
      if (Object.prototype.hasOwnProperty.call(this, 'Jupyter')) {
        injectCodeMirror = true;
        if (keybindings === undefined) {
          console.warn('Khulnasoft: found no keybindings for Jupyter Notebook');
          return;
        } else {
          const jupyterState = jupyterInject(extensionId, this.Jupyter, keybindings, debounceMs);
          addListeners(cm as CodeMirror, jupyterState.codeMirrorManager);
          console.log('Khulnasoft: Activating Jupyter Notebook');
        }
      } else {
        let multiplayer = false;
        let name = '';
        for (const pattern of SUPPORTED_CODEMIRROR_SITES) {
          if (pattern.pattern.test(window.location.href)) {
            name = pattern.name;
            injectCodeMirror = true;
            multiplayer = pattern.multiplayer;
            break;
          }
        }
        if (injectCodeMirror) {
          new CodeMirrorState(extensionId, cm as CodeMirror, multiplayer, debounceMs);
          console.log(`Khulnasoft: Activating CodeMirror Site: ${name}`);
        }
      }
    },
  });

// In this case, the CodeMirror 5 editor is accessible as a property of elements
// with the class CodeMirror.
// TODO(kevin): Do these still work?
const SUPPORTED_CODEMIRROR_NONGLOBAL_SITES = [
  { pattern: /https:\/\/console\.paperspace\.com\/.*\/notebook\/.*/, notebook: true },
  { pattern: /https?:\/\/www\.codewars\.com(\/.*)?/, notebook: false },
  { pattern: /https:\/\/(.*\.)?github\.com(\/.*)?/, notebook: false },
];

const codeMirrorState = new CodeMirrorState(extensionId, undefined, false);
const hook = codeMirrorState.editorHook();

const addCodeMirror5LocalInject = () => {
  const f = setInterval(() => {
    if (injectCodeMirror) {
      clearInterval(f);
      return;
    }
    let notebook = false;
    for (const pattern of SUPPORTED_CODEMIRROR_NONGLOBAL_SITES) {
      if (pattern.pattern.test(window.location.href)) {
        notebook = pattern.notebook;
        break;
      }
    }
    const docsByPosition = new Map<CodeMirror.Doc, number>();
    for (const el of document.getElementsByClassName('CodeMirror')) {
      const maybeCodeMirror = el as { CodeMirror?: CodeMirror.Editor };
      if (maybeCodeMirror.CodeMirror === undefined) {
        continue;
      }
      const editor = maybeCodeMirror.CodeMirror;
      hook(editor);
      if (notebook) {
        docsByPosition.set(editor.getDoc(), (el as HTMLElement).getBoundingClientRect().top);
      }
    }
    if (notebook) {
      const docs = [...docsByPosition.entries()].sort((a, b) => a[1] - b[1]).map(([doc]) => doc);
      codeMirrorState.docs = docs;
    }
  }, 500);
};

Promise.all([getAllowedAndKeybindings(extensionId), getDebounceMs(extensionId)]).then(
  ([allowedAndKeybindings, debounceMs]) => {
    const allowed = allowedAndKeybindings.allowed;
    const jupyterKeyBindings = allowedAndKeybindings.keyBindings;
    const debounce = debounceMs.debounceMs;
    const validInjectTypes = ['monaco', 'codemirror5', 'none'];
    const metaTag = document.querySelector('meta[name="khulnasoft:type"]');
    const injectionTypes =
      metaTag
        ?.getAttribute('content')
        ?.split(',')
        .map((x) => x.toLowerCase().trim())
        .filter((x) => validInjectTypes.includes(x)) ?? [];

    if (injectionTypes.includes('none')) {
      // do not inject if specifically disabled
      return;
    }

    // Inject jupyter lab; this is seperate from the others; this is seperate from the others
    const jupyterConfigDataElement = document.getElementById('jupyter-config-data');
    if (jupyterConfigDataElement !== null) {
      addJupyterLabInject(jupyterConfigDataElement, debounce);
      return;
    }

    if (injectionTypes.includes('monaco')) {
      addMonacoInject(debounce);
    }

    if (injectionTypes.includes('codemirror5')) {
      addCodeMirror5GlobalInject(jupyterKeyBindings, debounce);
      addCodeMirror5LocalInject();
    }

    if (injectionTypes.length === 0) {
      // if no meta tag is found, check the allowlist
      if (allowed) {
        // the url matches the allowlist
        addMonacoInject(debounce);
        addCodeMirror5GlobalInject(jupyterKeyBindings, debounce);
        addCodeMirror5LocalInject();
        return;
      }
    }
  },
  (e) => {
    console.error(e);
  }
);
