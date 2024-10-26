window.addEventListener('DOMContentLoaded', () => {
  console.log('content loaded')
})

// utility
function ce(type, attribs = [], text = null, parent = null) {
  const element = document.createElement(type)
  if (text) element.textContent = text
  attribs.forEach(a => { element.setAttribute(a.name, a.val) })
  if (parent) parent.appendChild(element)
  return element
}
