
### Build & Scripts Notes

- `dist/` folder is committed for Git-based consumption
- Library is compiled via `tsup` to ESM, CJS, and `.d.ts`
- Source maps are generated but not included in Git

To build the library:

```bash
yarn build
```

### Available Scripts

| Script          | Description                                               |
|-----------------|-----------------------------------------------------------|
| `yarn build`     | Clean and compile the library to `dist/` using `tsup`    |
| `yarn clean`     | Delete the `dist/` folder                                |
| `yarn dev`       | Start a development watcher (incremental rebuilds)       |
| `yarn check:build` | Run a silent build for CI sanity check (types only)    |
| `yarn test`      | Run the test suite with Jest                             |
| `yarn test:watch`| Watch and re-run tests on changes                        |
| `yarn lint`      | Run ESLint to check code style and errors                |
| `yarn lint:fix`  | Automatically fix lint errors                            |
| `yarn ts:compile` | Run TypeScript type checking without emitting output    |