/* eslint-disable no-console */

/**
 * Initialize the component manager by creating a single React root in a div that is appended to the
 * document body, and rendering the `Manager` component within it. If no component skels are found
 * in the document, nothing will be rendered.
 *
 * @param {Object} options
 * @param {string} options.selector - A string containing one or more selectors to match against.
 *   Each match will be loaded as a component. Default: '.componentManagedByProscenium'.
 * @param {function} options.buildComponentPath - If defined, will be called with the component
 *   path, and should return a new path. Can be used to rewrite the import path of components.
 * @param {string,Promise,Function} option.wrapWithComponent - Wrap each component with another.
 *   If a String, it should be a path to a module that will be dynamically imported and wrapped with
 *   React's `lazy` helper.
 *   If a function, that function should return a dynamic `import()` of the component you want to
 *   wrap with.
 *   If a promise, it should be result of a dynamic `import()`.
 * @param {boolean} option.debug - Will output debugging info to the console. Default: false.
 */
export default async (opts = {}) => {
  const options = {
    debug: false,
    selector: ".componentManagedByProscenium",
    buildComponentPath(x) {
      return x;
    },
    ...opts,
  };
  const nodes = document.querySelectorAll(options.selector);

  if (nodes.length < 1) return;

  const { lazy, createElement } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const Manager = lazy(() => import("./manager"));

  let wrapper;
  if (options.wrapWithComponent) {
    wrapper = buildImport(options.wrapWithComponent);
    if (typeof wrapper === "undefined") {
      console.warn(
        "[@proscenium/component-manager] `wrapWithComponent` option was passed to `init()` with an",
        "invalid type, so is ignored. Ensure it is a String, import(), or function."
      );
    } else {
      wrapper = lazy(wrapper);
    }
  }

  // Find our components to load.
  const components = Array.from(nodes, (domElement) => {
    const { path, props, ...params } = JSON.parse(domElement.dataset.component);
    const cpath = options.buildComponentPath(path);

    if (options.debug) {
      console.groupCollapsed(`[proscenium/component-manager] Found %o`, cpath);
      console.log("domElement: %o", domElement);
      console.log("props: %o", props);
      console.log("options: %o", params);
      console.groupEnd();
    }

    return {
      component: lazy(() => import(cpath)),
      path: cpath,
      props,
      domElement,
      ...params,
    };
  });

  const rootEle = document.createElement("div");
  document.body.append(rootEle);
  createRoot(rootEle).render(
    createElement(Manager, { components, wrapper, debug: options.debug })
  );
};

function buildImport(imp) {
  if (typeof imp == "string") {
    return () => import(imp);
  } else if (imp instanceof Promise) {
    return () => imp;
  } else if (typeof imp == "function") {
    return imp;
  }
}
