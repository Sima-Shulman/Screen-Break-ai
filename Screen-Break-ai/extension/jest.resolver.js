export default (request, options) => {
  // Force React and React-DOM to use the root node_modules version
  if (request === 'react' || request === 'react-dom') {
    return options.defaultResolver(request, {
      ...options,
      packageFilter: (pkg) => {
        return pkg;
      },
    });
  }
  
  return options.defaultResolver(request, options);
};