import { type GenuiArtifactV1, type GenuiStandaloneAsset } from './types.ts';
import type { GenuiSpec } from '../spec.ts';
/** 将二进制内容编码为不会闭合 script 标签的 Base64。 */
export declare function bytesToBase64(bytes: Uint8Array): string;
/** 转义 HTML 属性和标题中的文本。 */
export declare function escapeHtml(value: string): string;
/** 获取并缓存构建产物字节，失败时保留可识别的导出错误。 */
export declare function cachedBundle(name: string, code: GenuiStandaloneAsset | 'runtime'): Promise<Uint8Array>;
/** 创建仅存放 Base64 数据的非执行 payload 节点。 */
export declare function bundleElement(name: string, bytes: Uint8Array): string;
/** 将媒体相对地址转换为导出页面所在站点的绝对地址。 */
export declare function resolveMediaUrls(spec: GenuiSpec, baseURI: string): GenuiSpec;
/** 返回执行内嵌 bundle 的静态启动代码。 */
export declare function bootstrapSource(): string;
/** 使用已下载的运行文件生成完整的独立 HTML 文档。 */
export declare function createStandaloneHtmlDocument(artifact: GenuiArtifactV1, bundles: ReadonlyMap<string, Uint8Array>, baseURI?: string): string;
/** 获取独立运行文件及规格实际使用的图形引擎，生成单文件 HTML。 */
export declare function buildStandaloneHtml(rawArtifact: GenuiArtifactV1): Promise<string>;
