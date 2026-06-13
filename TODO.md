# TODO

- [ ] Fix Angular build failure: update TypeScript version to satisfy Angular Compiler requirements (>=5.5.0 and <5.9.0).
- [ ] Fix SCSS build failure: `Undefined function` for `mat.define-palette` usage in `src/styles.scss`.
- [ ] Ensure Material theming mixins/palette functions are imported/used correctly (verify Angular Material theming API usage for the installed Material version).
- [ ] Re-run `npm install` / `npm run build` (or `ng build`) to confirm errors are resolved.

Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json