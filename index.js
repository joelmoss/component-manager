/* eslint-disable no-console */

/**
 * Initialize the component manager by creating a React root for each component found on the page.
 * If no component skels are found in the document, nothing will be rendered.
 *
 * @param {Object} options
 * @param {function} options.buildComponentPath - If defined, will be called with the component
 *   path, and should return a new path. Can be used to rewrite the import path of components.
 * @param {boolean} options.debug - Will output debugging info to the console. Default: false.
 */
export default async (opts = {}) => {
  const options = {
    debug: false,
    buildComponentPath(x) {
      return x;
    },
    ...opts,
  };
  const component = document.querySelectorAll("[data-proscenium-component]");

  // Return now if there are no components.
  if (component.length < 1) return;

  init(component, options);
};

async function init(component, options) {
  const { Suspense, lazy, createElement } = await import("react");
  const { createRoot } = await import("react-dom/client");

  // Find our components to load.
  const components = Array.from(component, (domElement) => {
    const { path, props, ...params } = JSON.parse(
      domElement.dataset.prosceniumComponent
    );
    const cpath = options.buildComponentPath(path);

    if (options.debug) {
      console.groupCollapsed(`[proscenium/component-manager] Found %o`, cpath);
      console.log("domElement: %o", domElement);
      console.log("props: %o", props);
      console.log("options: %o", params);
      console.groupEnd();
    }

    const root = createRoot(domElement);

    if (params.lazy) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(domElement);

            root.render(
              createElement(
                lazy(() => import(cpath)),
                props
              )
            );
          }
        });
      });

      observer.observe(domElement);
    } else {
      root.render(
        createElement(
          lazy(() => import(cpath)),
          props
        )
      );
    }
  });
}
