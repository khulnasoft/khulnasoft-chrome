import { getStorageItem, setStorageItem } from './storage';

// Check if lastError is empty dict and clear it if not empty.
async function clearLastError(): Promise<void> {
  const lastError = await getStorageItem('lastError');
  if (lastError && Object.keys(lastError).length !== 0) {
    await setStorageItem('lastError', {});
  }
}

export async function loggedOut(): Promise<void> {
  await Promise.all([
    chrome.action.setPopup({ popup: 'popup.html' }),
    chrome.action.setBadgeText({ text: 'Login' }),
    chrome.action.setIcon({
      path: {
        16: '/icons/16/khulnasoft_square_inactive.png',
        32: '/icons/32/khulnasoft_square_inactive.png',
        48: '/icons/48/khulnasoft_square_inactive.png',
        128: '/icons/128/khulnasoft_square_inactive.png',
      },
    }),
    chrome.action.setTitle({ title: 'Khulnasoft' }),
    clearLastError(),
  ]);
}

export async function loggedIn(): Promise<void> {
  await Promise.all([
    chrome.action.setPopup({ popup: 'logged_in_popup.html' }),
    chrome.action.setBadgeText({ text: '' }),
    chrome.action.setIcon({
      path: {
        16: '/icons/16/khulnasoft_square_logo.png',
        32: '/icons/32/khulnasoft_square_logo.png',
        48: '/icons/48/khulnasoft_square_logo.png',
        128: '/icons/128/khulnasoft_square_logo.png',
      },
    }),
    chrome.action.setTitle({ title: 'Khulnasoft' }),
    clearLastError(),
  ]);
}

export async function unhealthy(message: string): Promise<void> {
  // We don't set the badge text on purpose.
  await Promise.all([
    chrome.action.setPopup({ popup: 'logged_in_popup.html' }),
    chrome.action.setIcon({
      path: {
        16: '/icons/16/khulnasoft_square_error.png',
        32: '/icons/32/khulnasoft_square_error.png',
        48: '/icons/48/khulnasoft_square_error.png',
        128: '/icons/128/khulnasoft_square_error.png',
      },
    }),
    chrome.action.setTitle({ title: `Khulnasoft (error: ${message})` }),
    setStorageItem('lastError', { message: message }),
  ]);
}
