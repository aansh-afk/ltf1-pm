module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          reanimated: false,
          worklets: false,
        },
      ],
    ],
    plugins: [
      require("react-native-css-interop/dist/babel-plugin").default,
      "react-native-reanimated/plugin",
    ],
  };
};
