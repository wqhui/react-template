import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import * as PATHS from '../paths.js'

const IS_DEV = process.env.NODE_ENV === 'development'
const CSS_NAME = IS_DEV ? 'css/[name].css' : 'css/[name].[contenthash:8].css'
const JS_NAME = IS_DEV ? 'js/[name].js' : 'js/[name].[chunkhash:8].js'
const LESS_NAME = 'hui-[name]-[local]--[hash:base64:5]'

const IMGAE_INLINE_LINT_SIZE = 8 * 1024

/** @type {import('webpack').Configuration} */
const commonConfig = {
  entry: {
    app: PATHS.entryPath,
  },
  output: {
    path: PATHS.outputPath,
    filename: JS_NAME,
    clean: true, //清理上次打包文件
  },
  resolve: {
    // 指定可以省略的文件扩展名 Webpack 会自动尝试查找 MyComponent.ts、MyComponent.tsx、MyComponent.js 和 MyComponent.jsx 文件
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': PATHS.srcPath,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/, // 增加对 .ts 和 .tsx 文件的支持
        use: [
          // 'thread-loader',  线程启动开销较大，小型项目优化效果不明显，如果大型项目（文件超过100个）再启动
          'babel-loader',
          {
            loader: 'ts-loader', //仅转译，错误放到fork-ts-Checker-webpack-plugin处理
            options: {
              happyPackMode: true, // 为了多线程打包，开启 happyPackMode
              transpileOnly: true, // 禁用 ts-loader 的类型检查
            },
          },
        ],
        include: [PATHS.srcPath],
        exclude: PATHS.nodeModulesPath,
      },
      {
        test: /(\.css|\.less)$/,
        exclude: PATHS.nodeModulesPath,
        use: [
          {
            loader: MiniCssExtractPlugin.loader, //以link的方式插入html
          },
          {
            loader: 'css-loader',
            options: {
              esModule: false, // 关闭css的esModule，允许默认导出
              // 启用 CSS 模块，设置模式为局部作用域
              modules: {
                // 采用局部模式，类名仅在当前文件生效
                mode: 'local',
                // 定义生成的局部类名格式
                localIdentName: LESS_NAME,
              },
            },
          },
          'postcss-loader', //css自动兼容，配置见postcss.config.js
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: IMGAE_INLINE_LINT_SIZE, // 小于8k的内联url(data:) 大于4k的直接路径引用
          },
        },
        generator: {
          filename: 'assets/images/[hash][ext][query]',
        },
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2?)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext][query]',
        },
      },
    ],
  },
  optimization: {
    splitChunks: {
      maxInitialRequests: 5,
      cacheGroups: {
        //提取所有的 CSS 到一个文件中
        // styles: {
        //     name: 'app',
        //     type: 'css/mini-extract',
        //     // For webpack@4
        //     // test: /\.css$/,
        //     chunks: 'all',
        //     enforce: true,
        // },
        //分割src代码
        common: {
          name: 'chunk-common',
          test: /[\\/]src[\\/]/,
          //可选值有 async、 initial 和 all。
          //默认值是 async，也就是默认只选取异步加载的chunk进行代码拆分。
          //initial 也就是默认同步加载的代码
          //all 上述两种情况都涵盖
          chunks: 'all',
          // 拆分前必须共享模块的最小 chunks 数,也就是当前的文件被1个以上的文件引用时才拆分
          minChunks: 1,
          //生成 chunk 的最小体积（以 bytes 为单位）
          minSize: 0,
          //一个模块可以属于多个缓存组。优化将优先考虑具有更高 priority（优先级）的缓存组
          priority: 1,
        },
        //分割node包代码
        vendors: {
          name(module) {
            const moduleName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/,
            )[1]
            if (moduleName.includes('react')) {
              return 'react-chunk'
            }
            if (
              moduleName.includes('antd') ||
              moduleName.includes('@ant-design')
            ) {
              return 'antd-chunk'
            }
            return 'vendor-chunk'
          },
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: 10,
        },
        // antd: {
        //   name: 'chunk-antd',
        //   test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/, // 同时匹配 antd 和 @ant-design 图标库
        //   chunks: 'all',
        //   minSize: 0,
        //   priority: 3,
        // },
      },
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: PATHS.publicHtmlPath,
      favicon: PATHS.faviconPath,
    }),
    new MiniCssExtractPlugin({
      filename: CSS_NAME,
    }),
    //定义到模块中使用的process.env，默认的就是mode参数的值
    new webpack.DefinePlugin({
      'process.env': {},
    }),
    new ForkTsCheckerWebpackPlugin({
      //加快ts类型检查速度
      devServer: false,
    }),
  ],
}

export default commonConfig
