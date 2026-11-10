/** Provider 声明的 sidechat 内容及其稳定身份和专属交互路由。 */
export interface SidechatSurface {
    readonly root: HTMLElement;
    /** Provider 提供的稳定 surface 名称，同时写入 root 标记。 */
    readonly source: string;
    readonly threadId: string;
    readonly eventSeq: number;
    readonly contentBlockIndex: number;
    readonly text: string;
    readonly sendPrompt: (text: string) => Promise<void>;
}
/** 宿主或插件向 GenUI 提供的 sidechat adapter 注册接口。 */
export interface SidechatSurfaceService {
    registerSidechatSurfaceAdapter(adapter: {
        readonly id: string;
        readonly mount: (surface: SidechatSurface) => (() => void);
    }): () => void;
}
/**
 * Mount only a provider-declared, settled assistant text block. Pair ALL host
 * code blocks with ALL source AST code nodes by ordinal AND exact body. A
 * mismatch, unsupported panel, or malformed spec leaves the stock Markdown.
 * No main-session lookup, fallback action route, global query or polling.
 */
export declare function mountSidechatSurface(surface: SidechatSurface): () => void;
/** 向提供通用 sidechat service 的宿主注册 GenUI adapter。 */
export declare function installSidechatAdapter(service: Partial<SidechatSurfaceService> | undefined): () => void;
