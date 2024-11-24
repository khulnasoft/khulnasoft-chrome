<p align="center">
  <img width="300" alt="Khulnasoft" src="khulnasoft.svg"/>
</p>

---

[![Discord](https://img.shields.io/discord/1027685395649015980?label=community&color=5865F2&logo=discord&logoColor=FFFFFF)](https://discord.gg/3XFf78nAx5)
[![Twitter Follow](https://img.shields.io/badge/style--blue?style=social&logo=twitter&label=Follow%20%40khulnasoftdev)](https://twitter.com/intent/follow?screen_name=khulnasoftdev)
![License](https://img.shields.io/github/license/khulnasoft/khulnasoft-chrome)
[![Docs](https://img.shields.io/badge/Khulnasoft%20Docs-09B6A2)](https://docs.khulnasoft.com)

[![Visual Studio](https://img.shields.io/visual-studio-marketplace/i/Khulnasoft.khulnasoft?label=Visual%20Studio&logo=visualstudio)](https://marketplace.visualstudio.com/items?itemName=Khulnasoft.khulnasoft)
[![JetBrains](https://img.shields.io/jetbrains/plugin/d/20540?label=JetBrains)](https://plugins.jetbrains.com/plugin/20540-khulnasoft/)
[![Open VSX](https://img.shields.io/open-vsx/dt/Khulnasoft/khulnasoft?label=Open%20VSX)](https://open-vsx.org/extension/Khulnasoft/khulnasoft)
[![Google Chrome](https://img.shields.io/chrome-web-store/users/hobjkcpmjhlegmobgonaagepfckjkceh?label=Google%20Chrome&logo=googlechrome&logoColor=FFFFFF)](https://chrome.google.com/webstore/detail/khulnasoft/hobjkcpmjhlegmobgonaagepfckjkceh)

# khulnasoft-chrome

_Free, ultrafast code autocomplete for Chrome_

[Khulnasoft](https://khulnasoft.com/) autocompletes your code with AI in all major IDEs. This includes web editors as well! This Chrome extension currently supports:

- [CodePen](https://codepen.io/)
- [Codeshare](https://codeshare.io/)
- [Codewars](https://www.codewars.com/)
- [Databricks notebooks (Monaco editor only)](https://www.databricks.com/)
- [Deepnote](https://deepnote.com/)
- [GitHub](https://github.com/)
- [Google Colab](https://colab.research.google.com/)
- [JSFiddle](https://jsfiddle.net/)
- [JupyterLab 3.x/Jupyter notebooks](https://jupyter.org/)
- [LiveCodes](https://livecodes.io/)
- [Paperspace](https://www.paperspace.com/)
- [Quadratic](https://www.quadratichq.com/)
- [StackBlitz](https://stackblitz.com/)

In addition, any web page can support autocomplete in editors by adding the following meta tag to the `<head>` section of the page:

```html
<meta name="khulnasoft:type" content="monaco" />
```

The `content` attribute accepts a comma-separated list of supported editors. These currently include: `"monaco"` and `"codemirror5"`.

To disable the extension in a specific page add the following meta tag:

```html
<meta name="khulnasoft:type" content="none" />
```

Contributions are welcome! Feel free to submit pull requests and issues related to the extension or to add links to supported websites.

🔗 [Original Chrome extension launch announcement](https://khulnasoft.com/blog/khulnasoft-chrome-extension-launch)

## 🚀 Getting started

To use the extension, install it from the [Chrome Web Store.](https://chrome.google.com/webstore/detail/khulnasoft/hobjkcpmjhlegmobgonaagepfckjkceh)

If you'd like to develop the extension, you'll need Node and pnpm (`npm install -g pnpm`). After `pnpm install`, use `pnpm start` to develop, and `pnpm build` to package. For the enterprise build, use `pnpm build:enterprise`.
