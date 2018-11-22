const sass = require('node-sass');
const path = require('path');

module.exports = function processSass(data, filename) {
  /**
   * we need to remove the ~ that was used for the sass loader,
   * otherwise the path with include paths is wrong.
   */
  const removeTilde = data.replace(/~/g, '');
  const result = sass.renderSync({
    data: removeTilde,
    file: filename,
    includePaths: [path.join(__dirname, 'src')],
    outputStyle: 'compressed',
  }).css;

  return result.toString('utf8');
};
