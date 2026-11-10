import { type ReactElement } from 'react';
import type { GenuiEntityCard } from '../spec.ts';
import type { GenuiBlockProps } from './state.ts';
/** 显示实体概要、安全来源链接和操作入口。 */
export declare function EntityCardNode({ node, onAction }: {
    node: GenuiEntityCard;
    onAction?: GenuiBlockProps['onAction'];
}): ReactElement;
