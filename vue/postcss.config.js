export default {
  plugins: {
    'postcss-pxtorem': {
      // 根元素字体大小，基于16px
      rootValue: 16,
      // 需要转换的属性，*表示所有属性
      propList: ['*'],
      // 需要转换的选择器，*表示所有选择器
      selectorBlackList: [],
      // 替换规则，支持正则表达式
      replace: true,
      // 媒体查询中是否转换px
      mediaQuery: false,
      // 最小转换的px值，小于此值不转换
      minPixelValue: 0,
      // 排除的文件，支持正则表达式
      exclude: /node_modules/i,
      // 包含的文件，支持正则表达式
      include: /src/i,
      // 单位精度，小数点后几位
      unitPrecision: 5,
      // 是否转换字体大小
      fontViewportUnit: 'vw',
      // 是否转换行高
      lineHeightUnit: 'rem'
    }
  }
}