import { merge } from 'webpack-merge'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import * as PATHS from '../paths.js'
import commonConfig from './webpack.common.js'

const prodConfig = merge(commonConfig, {
  mode: 'production',
  devtool: 'source-map', //生成.js.map的映射文件
  optimization: {
    minimizer: [
      //压缩css
      new CssMinimizerPlugin({
        exclude: PATHS.nodeModulesPath,
      }),
      //压缩js 也可以使用...扩展现有的
      new TerserPlugin({
        parallel: true, //多进程
      }),
    ],
  },
})

export default prodConfig
