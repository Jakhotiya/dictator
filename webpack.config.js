const webpack =  require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const { NODE_ENV = 'development' } = process.env

const base = {
  context: __dirname,
  entry: {
    'background': './src/background/index.js',
    'content-script': './src/content-scripts/index.js',
    'panel': './src/panel/index.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new CopyPlugin([
      { from: './src/manifest.json', to: './manifest.json' },
      { from: './src/devtools.js', to: './devtools.js' },
      { from: './src/devtools.html', to: './devtools.html' },
      { from: './src/typewriter-64.png', to: './typewriter-64.png' },
    ]),
    new HtmlWebpackPlugin({
      template: './src/panel/template.html',
      chunks: ['panel']
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(NODE_ENV)
      }
    })
  ]
}

const development = {
  ...base,
  devtool: 'cheap-module-source-map',
  module: {
    ...base.module,
    rules: [
      ...base.module.rules,
      {
        test: /\.css$/,
        include: /src/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              localIdentName: '[local]_[hash:8]',
              modules: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    ...base.plugins,
    new webpack.HotModuleReplacementPlugin()
  ],
  mode:'development'
}

const production = {
  ...base,
  devtool: '#source-map',
  module: {
    ...base.module,
    rules: [
      ...base.module.rules,
      {
        test: /\.css$/,
        include: /src/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                localIdentName: '[hash:8]'
              }
            }

          ]
        })
      },
      {
        test: /\.css$/,
        exclude: /src/,
        loader: ExtractTextPlugin.extract({ use: [ 'css-loader' ] })
      }
    ]
  },
  plugins: [
    ...base.plugins,
    new ExtractTextPlugin({
      filename: 'bundle-[hash:8].css',
      allChunks: true
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    })
  ]
}

if (NODE_ENV === 'development') {
  module.exports = development
} else {
  module.exports = production
}
