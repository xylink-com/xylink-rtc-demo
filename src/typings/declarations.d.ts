// declaration.d.ts
declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}
declare module "*.module.less" {
  const classes: { [key: string]: string };
  export default classes;
}
declare module "*.ogg" {
  const src: string;
  export default src;
}
declare module "*.wav" {
  const src: string;
  export default src;
}
