const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
      test: /\.(scss|css)$/,
      exclude: /\.module\.scss$/,
      use: [
        'style-loader',
        'css-loader', 
        'sass-loader'
      ]
    },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript']
          }
        }
      },
      {
        test: /\.(woff2|woff|ttf|eot)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]', // Шрифты будут в /dist/fonts/
        },
      },
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: 'public/assets', 
          to: 'assets' 
        }
      ],
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico'
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/',
    },
    port: 3000,
    hot: true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  devServer: {
  static: {
    directory: path.join(__dirname, 'public'),
  },
},
  resolve: {
    extensions: ['.js', '.jsx']
  }
};

//для работы данного плагина: npm init -y
//npm install --save-dev webpack webpack-cli webpack-dev-server style-loader css-loader postcss-loader sass-loader sass babel-loader @babel/core @babel/preset-env @babel/preset-react html-webpack-plugin copy-webpack-plugin autoprefixer