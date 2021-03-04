export const generateActiveCode = (chars = true) => {
  return chars
    ? Math.random().toString(32).slice(-6).toUpperCase()
    : Math.floor(Math.random() * 10000000)
        .toString()
        .slice(-6);
};
