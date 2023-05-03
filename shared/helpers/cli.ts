export const run = (main: () => Promise<void>): void => {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
};
