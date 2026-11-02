declare module "*.css";

declare module "*.svg?raw" {
	const content: string;
	export default content;
}

declare module "*.webm" {
	const url: string;
	export default url;
}
