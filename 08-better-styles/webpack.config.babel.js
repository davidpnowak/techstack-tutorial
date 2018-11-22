import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';

import { WDS_PORT, isProd } from './src/shared/config';

// #1
//
// Universal Config
const commonConfig = {
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [path.join(__dirname, 'src'), 'node_modules'],
  },
  plugins: [new webpack.optimize.OccurrenceOrderPlugin(), new webpack.NoEmitOnErrorsPlugin()],
};

// #2
//
// Development Config
const developmentConfig = {
  entry: ['react-hot-loader/patch', './src/client'],
  output: {
    publicPath: `http://localhost:${WDS_PORT}/dist/`,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        query: {
          presets: ['env', 'react'],
          babelrc: false,
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            query: {
              modules: true,
              importLoaders: true,
              localIdentName: '[name]__[local]___[hash:base64:5]',
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  devtool: 'source-map',
  devServer: {
    port: WDS_PORT,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  plugins: [
    // Development plugins
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
  ],
};

// #3
//
// Production Config
const productionConfig = {
  entry: ['./src/client'],
  output: {
    publicPath: '/static/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            query: {
              modules: true,
              importLoaders: true,
              localIdentName: '[name]__[local]___[hash:base64:5]',
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  devtool: false,
};

const config = () => {
  if (isProd) {
    return merge(commonConfig, productionConfig);
  }

  return merge(commonConfig, developmentConfig);
};

export default config;
