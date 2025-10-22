// Safe DOM manipulation functions

/**
 * Sets the text content of an element by ID after validating its existence.
 * @param {string} id - The ID of the element.
 * @param {string} text - The text to set.
 */
function setTextContentById(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`Element with ID '${id}' does not exist.`);
    }
}

/**
 * Replaces the inner HTML of an element by ID after validating its existence.
 * @param {string} id - The ID of the element.
 * @param {string} html - The HTML to set.
 */
function setInnerHTMLById(id, html) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = html;
    } else {
        console.warn(`Element with ID '${id}' does not exist.`);
    }
}

/**
 * Appends a child element to a parent element by ID after validating both exist.
 * @param {string} parentId - The ID of the parent element.
 * @param {HTMLElement} child - The child element to append.
 */
function appendChildToParentById(parentId, child) {
    const parentElement = document.getElementById(parentId);
    if (parentElement) {
        parentElement.appendChild(child);
    } else {
        console.warn(`Parent element with ID '${parentId}' does not exist.`);
    }
}

// Exporting functions for use in other modules
export { setTextContentById, setInnerHTMLById, appendChildToParentById };