import StateManager from './state/StateManager';
import StorageManager from './storage/StorageManager';
import { formatDate } from './utils/date-utils';
import { createElement, render } from './utils/dom-helpers';

// Initialize the app structure
const stateManager = new StateManager();
const storageManager = new StorageManager();

// Sample usage: Log the current date
console.log(formatDate(new Date()));

// Example of creating a simple DOM element
const appElement = createElement('div', { id: 'app' }, 'Welcome to the Cardiac Recovery App');
render(appElement, document.body);