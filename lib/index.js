import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import z from "@deepseek-ai/schemastery";
//#region src/client/genui-runtime/schema.ts
/** Canonical enum domains shared by schema validation and repair. */
/** Comparison operators a `when` condition can use (kept with the other
* runtime enums: `spec.ts` imports this module, so the list lives here). */
const WHEN_OPS = [
	"eq",
	"neq",
	"in",
	"not-in",
	"gt",
	"gte",
	"lt",
	"lte",
	"empty",
	"not-empty",
	"checked"
];
const TEXT_SIZES = [
	"display",
	"h1",
	"h2",
	"h3",
	"body",
	"muted",
	"caption"
];
const TEXT_ALIGNS = [
	"left",
	"center",
	"right"
];
const BUTTON_TONES = [
	"primary",
	"danger",
	"success",
	"ghost"
];
const BADGE_TONES = [
	"success",
	"warn",
	"danger",
	"accent"
];
const INPUT_TYPES = [
	"text",
	"email",
	"password",
	"color",
	"number"
];
const DATE_PICKER_MODES = ["single", "range"];
const CALLOUT_TONES = [
	"info",
	"success",
	"warning",
	"error"
];
const CHART_KINDS = [
	"bars",
	"line",
	"donut"
];
const PLOT_KINDS = [
	"line",
	"area",
	"scatter"
];
const MEDIA_ASPECT_RATIOS = [
	"16:9",
	"4:3",
	"1:1",
	"9:16"
];
const COMPARE_MODES = [
	"side",
	"stack",
	"slider"
];
const CHOICE_MODES = ["single", "multi"];
const POPOVER_TRIGGERS = ["click", "hover"];
const POPOVER_PLACEMENTS = [
	"top",
	"top-start",
	"top-end",
	"right",
	"right-start",
	"right-end",
	"bottom",
	"bottom-start",
	"bottom-end",
	"left",
	"left-start",
	"left-end"
];
const MESH_SHAPES = [
	"box",
	"sphere",
	"cone",
	"cylinder",
	"torus"
];
const FILE_TYPES = ["file", "dir"];
const DIAGRAM_KINDS = [
	"architecture",
	"it-state",
	"flowchart",
	"sequence",
	"state",
	"er",
	"timeline",
	"swimlane",
	"quadrant",
	"radar",
	"loop",
	"nested",
	"tree",
	"org-chart",
	"layers",
	"venn",
	"pyramid",
	"bar",
	"line",
	"gantt",
	"scatter",
	"high-level",
	"process",
	"medallion",
	"data-flow",
	"dp-integration",
	"dp-security-matrix"
];
const DIAGRAM_NODE_TYPES = [
	"focal",
	"backend",
	"store",
	"external",
	"input",
	"optional",
	"security"
];
const DIAGRAM_VARIANTS = [
	"light",
	"dark",
	"editorial"
];
const DIAGRAM_EDGE_KINDS = [
	"solid",
	"dashed",
	"accent",
	"link"
];
const DIAGRAM_ROUTES = [
	"auto",
	"orthogonal",
	"straight"
];
const ECHART_PRESETS = [
	"bar",
	"line",
	"area",
	"pie",
	"scatter",
	"radar",
	"gauge",
	"funnel",
	"treemap",
	"sankey",
	"graph",
	"heatmap",
	"bigline",
	"wordCloud"
];
/** Oversized single-number stat (one per fence as the visual anchor). */
const STAT_SIZES = ["hero"];
/** Progress shapes: a track (default) or a circular gauge. */
const PROGRESS_VARIANTS = ["bar", "ring"];
/** Semantic card surfaces. */
const CARD_TONES = [
	"info",
	"success",
	"warning",
	"danger"
];
/** Text run tones (semantic colour without a badge). */
const TEXT_TONES = [
	"danger",
	"success",
	"warning",
	"info",
	"muted"
];
/** Arrow directions. */
const ARROW_DIRS = ["down", "right"];
/** Row main-axis alignment values. */
const ROW_JUSTIFY = [
	"start",
	"center",
	"end",
	"between"
];
/** Block-row paint modes: filled cells, or outlined cells for bit grids. */
const BLOCKS_VARIANTS = [
	"fill",
	"outline",
	"plain"
];
/** 单格强调的语义档位。 */
const BLOCK_CELL_TONES = [
	"accent",
	"success",
	"warning",
	"danger",
	"muted"
];
/** Icon tones: the four semantic roles plus neutral/muted text colours. */
const ICON_TONES = [
	"default",
	"muted",
	"info",
	"success",
	"warning",
	"danger"
];
/** Hero cover tones. */
const HERO_TONES = [
	"accent",
	"success",
	"warning",
	"danger"
];
/** Table cell renderers (`table.types`, one entry per column). */
const TABLE_CELL_TYPES = [
	"text",
	"num",
	"delta",
	"bar",
	"badge",
	"spark",
	"ring",
	"index",
	"group"
];
const schema = (required, fields, aliases = {}, options = {}) => {
	const optional = Object.fromEntries(Object.entries(fields).filter(([field]) => field !== "type" && !required.includes(field)));
	const oneOfRequired = options.oneOfRequired ?? [];
	const conditionalRequired = options.conditionalRequired ?? [];
	const rules = [...oneOfRequired.map((fieldsInRule) => ({
		kind: "one-of-required",
		fields: fieldsInRule
	})), ...conditionalRequired];
	return {
		required,
		fields,
		optional,
		aliases,
		valueAliases: options.valueAliases ?? {},
		oneOfRequired,
		conditionalRequired,
		rules,
		enums: options.enums ?? {},
		nested: options.nested ?? {},
		...options.validator === void 0 ? {} : { validator: options.validator }
	};
};
const recordSchema = (required, fields, nested = {}, enums = {}, aliases = {}) => ({
	required,
	fields,
	enums,
	nested,
	aliases
});
const nodeFields = {
	type: "string",
	span: "number",
	when: "object",
	enableWhen: "object",
	disabledReason: "string",
	style: "object"
};
/** Node fields minus the fork's inline `style` (for nodes where `style` means something else). */
function withoutStyle(fields) {
	const { style: _style, ...rest } = fields;
	return rest;
}
/** Conditional visibility carried by any node: `{ field, op, value? }`. */
const whenSchema = recordSchema(["field", "op"], {
	field: "string",
	op: "string",
	value: "unknown"
}, {}, { op: WHEN_OPS });
const chartDatumSchema = recordSchema(["label", "value"], {
	label: "string",
	value: "unknown",
	color: "string"
});
const computedFieldSchema = recordSchema(["id", "expr"], {
	id: "string",
	expr: "string",
	format: "object"
}, { format: recordSchema([], {
	locale: "string",
	style: "string",
	currency: "string",
	minimumFractionDigits: "number",
	maximumFractionDigits: "number"
}, {}, { style: [
	"decimal",
	"currency",
	"percent"
] }) });
const chartSeriesSchema = recordSchema(["label", "data"], {
	label: "string",
	color: "string",
	data: "array"
}, { data: chartDatumSchema });
const stepsRecordSchema = recordSchema(["title"], {
	title: "string",
	desc: "string"
});
const keyValueRecordSchema = recordSchema(["key", "value"], {
	key: "string",
	value: "string"
}, {}, {}, { label: "key" });
const timelineRecordSchema = recordSchema(["title"], {
	title: "string",
	desc: "string",
	time: "string"
});
const blocksRowSchema = recordSchema(["cells"], {
	label: "string",
	cells: "array",
	color: "string",
	variant: "string"
}, {}, { variant: BLOCKS_VARIANTS }, { title: "label" });
const diffRecordSchema = recordSchema(["path", "newText"], {
	path: "string",
	oldText: "string-or-null",
	newText: "string"
});
const plotSeriesSchema = recordSchema(["expr"], {
	expr: "string",
	label: "string",
	color: "string",
	kind: "string",
	params: "array"
}, { params: recordSchema(["name", "value"], {
	name: "string",
	value: "number",
	min: "number",
	max: "number",
	step: "number",
	animateTo: "number",
	durationMs: "number",
	loop: "boolean"
}) }, { kind: PLOT_KINDS });
const sceneMeshSchema = recordSchema(["shape"], {
	shape: "string",
	color: "string",
	position: "array",
	rotation: "array",
	scale: "unknown",
	size: "unknown"
}, {}, { shape: MESH_SHAPES });
function fileTreeRecordSchema(depth) {
	return recordSchema(["name"], {
		name: "string",
		type: "string",
		children: "array"
	}, depth > 0 ? { children: fileTreeRecordSchema(depth - 1) } : {}, { type: FILE_TYPES }, { label: "name" });
}
const fileTreeNodeSchema = fileTreeRecordSchema(6);
const imageGroupItemSchema = recordSchema(["src"], {
	src: "string",
	alt: "string",
	caption: "string"
}, {}, {}, {
	url: "src",
	link: "src"
});
const entityMetadataSchema = recordSchema(["label", "value"], {
	label: "string",
	value: "string"
});
const entityActionSchema = recordSchema(["label", "action"], {
	label: "string",
	action: "string",
	tone: "string"
}, {}, { tone: BUTTON_TONES });
/** One side of a `compare` pair: the same media policy, plus a visible chip. */
/** One option row: label + cost + optional evidence and state. */
const choiceItemSchema = recordSchema(["label"], {
	label: "string",
	hint: "string",
	meta: "string",
	recommended: "boolean",
	disabled: "boolean",
	reason: "string"
}, {}, {}, {});
const comparePanelSchema = recordSchema(["src"], {
	src: "string",
	label: "string",
	alt: "string",
	caption: "string"
}, {}, {}, {
	url: "src",
	link: "src"
});
const tabHolderSchema = recordSchema(["label", "items"], {
	label: "string",
	items: "nodes",
	content: "nodes"
});
const accordionHolderSchema = recordSchema(["title", "items"], {
	title: "string",
	items: "nodes"
});
const diagramNodeSchema = recordSchema(["id", "label"], {
	id: "string",
	label: "string",
	sub: "string",
	description: "string",
	type: "string",
	x: "number",
	y: "number",
	w: "number",
	h: "number",
	tag: "string"
}, {}, { type: DIAGRAM_NODE_TYPES });
const diagramEdgeSchema = recordSchema(["from", "to"], {
	from: "string",
	to: "string",
	label: "string",
	kind: "string",
	route: "string"
}, {}, {
	kind: DIAGRAM_EDGE_KINDS,
	route: DIAGRAM_ROUTES
});
const diagramZoneSchema = recordSchema(["label"], {
	label: "string",
	x: "number",
	y: "number",
	w: "number",
	h: "number"
});
const diagramThemeSchema = recordSchema([], {
	paper: "string",
	"paper-2": "string",
	ink: "string",
	muted: "string",
	soft: "string",
	rule: "string",
	accent: "string",
	"accent-tint": "string",
	link: "string"
});
/** Root GenUI specification metadata used by diagnostics. */
const GENUI_SPEC_SCHEMA = schema(["items"], {
	title: "string",
	gap: "number",
	panel: "boolean",
	append: "boolean",
	computed: "array",
	theme: "object",
	items: "nodes"
}, {}, { nested: { computed: computedFieldSchema } });
/**
* Native component field metadata.
*
* This is intentionally explicit rather than inferred from TypeScript
* interfaces: the registry is also consumed at runtime by normalization and
* diagnostics, where erased interfaces are unavailable.
*/
const RAW_COMPONENT_SCHEMAS = {
	arrow: schema([], {
		...nodeFields,
		dir: "string",
		length: "number",
		label: "string"
	}, { direction: "dir" }, { enums: { dir: ARROW_DIRS } }),
	accordion: schema(["items"], {
		...nodeFields,
		items: "array"
	}, {}, { nested: { items: accordionHolderSchema } }),
	audio: schema(["src"], {
		...nodeFields,
		src: "string",
		alt: "string",
		loop: "boolean"
	}, {
		url: "src",
		link: "src"
	}),
	avatar: schema(["name"], {
		...nodeFields,
		name: "string",
		color: "string"
	}),
	badge: schema(["label"], {
		...nodeFields,
		label: "string",
		tone: "string",
		icon: "string"
	}, {
		text: "label",
		value: "label"
	}, { enums: { tone: BADGE_TONES } }),
	breadcrumb: schema(["items"], {
		...nodeFields,
		items: "array"
	}),
	button: schema(["label"], {
		...nodeFields,
		label: "string",
		tone: "string",
		full: "boolean",
		small: "boolean",
		icon: "string",
		action: "string"
	}, {}, { enums: { tone: BUTTON_TONES } }),
	callout: schema(["content"], {
		...nodeFields,
		title: "string",
		content: "string",
		tone: "string"
	}, {
		kind: "tone",
		text: "content",
		body: "content",
		desc: "content"
	}, {
		enums: { tone: CALLOUT_TONES },
		valueAliases: { tone: {
			danger: "error",
			warn: "warning"
		} }
	}),
	card: schema(["items"], {
		...nodeFields,
		title: "string",
		eyebrow: "string",
		items: "nodes",
		tone: "string",
		accent: "string",
		flat: "boolean"
	}, {
		label: "title",
		content: "items",
		body: "items"
	}, { enums: { tone: CARD_TONES } }),
	carousel: schema(["items"], {
		...nodeFields,
		items: "nodes",
		title: "string",
		itemWidth: "number",
		gap: "number"
	}, { children: "items" }),
	"image-group": schema(["items"], {
		...nodeFields,
		items: "array",
		title: "string"
	}, {}, { nested: { items: imageGroupItemSchema } }),
	editor: schema(["id", "value"], {
		...nodeFields,
		id: "string",
		value: "string",
		label: "string",
		placeholder: "string",
		rows: "number"
	}),
	"entity-card": schema(["name"], {
		...nodeFields,
		name: "string",
		image: "string",
		imageAlt: "string",
		description: "string",
		metadata: "array",
		href: "string",
		sourceLabel: "string",
		actions: "array"
	}, {}, { nested: {
		metadata: entityMetadataSchema,
		actions: entityActionSchema
	} }),
	popover: schema(["label", "content"], {
		...nodeFields,
		label: "string",
		content: "string",
		trigger: "string",
		placement: "string"
	}, {}, { enums: {
		trigger: POPOVER_TRIGGERS,
		placement: POPOVER_PLACEMENTS
	} }),
	choices: schema(["items"], {
		...nodeFields,
		title: "string",
		prompt: "string",
		mode: "string",
		items: "array",
		submit: "string",
		action: "string",
		max: "number",
		group: "string",
		answer: "unknown",
		explanation: "string"
	}, {}, {
		nested: { items: choiceItemSchema },
		enums: { mode: CHOICE_MODES }
	}),
	compare: schema(["before", "after"], {
		...nodeFields,
		title: "string",
		before: "object",
		after: "object",
		mode: "string",
		height: "number"
	}, {}, {
		nested: {
			before: comparePanelSchema,
			after: comparePanelSchema
		},
		enums: { mode: COMPARE_MODES }
	}),
	chart: schema([], {
		...nodeFields,
		kind: "string",
		data: "array",
		series: "array",
		horizontal: "boolean",
		stacked: "boolean",
		filter: "string",
		palette: "array"
	}, {}, {
		oneOfRequired: [["data", "series"]],
		conditionalRequired: [{
			kind: "required-if",
			when: {
				field: "kind",
				equals: "donut"
			},
			required: ["data"]
		}],
		nested: {
			data: chartDatumSchema,
			series: chartSeriesSchema
		},
		enums: { kind: CHART_KINDS },
		validator: { name: "chart-renderability" }
	}),
	checkbox: schema(["label"], {
		...nodeFields,
		label: "string",
		checked: "boolean",
		action: "string",
		group: "string"
	}),
	code: schema(["code"], {
		...nodeFields,
		lang: "string",
		code: "string"
	}, {
		content: "code",
		text: "code"
	}),
	col: schema(["items"], {
		...nodeFields,
		items: "nodes",
		gap: "number",
		width: "number"
	}),
	copy: schema(["text"], {
		...nodeFields,
		label: "string",
		text: "string",
		expandable: "boolean",
		previewLines: "number"
	}, {
		content: "text",
		code: "text",
		value: "text"
	}),
	diagram: schema(["kind", "nodes"], {
		...nodeFields,
		id: "string",
		kind: "string",
		variant: "string",
		title: "string",
		nodes: "array",
		edges: "array",
		zones: "array",
		theme: "object"
	}, {}, {
		nested: {
			nodes: diagramNodeSchema,
			edges: diagramEdgeSchema,
			zones: diagramZoneSchema,
			theme: diagramThemeSchema
		},
		enums: {
			kind: DIAGRAM_KINDS,
			variant: DIAGRAM_VARIANTS
		}
	}),
	diff: schema(["diffs"], {
		...nodeFields,
		diffs: "array"
	}, {
		items: "diffs",
		files: "diffs"
	}, { nested: { diffs: diffRecordSchema } }),
	divider: schema([], {
		...nodeFields,
		label: "string"
	}, {
		title: "label",
		text: "label"
	}),
	echart: schema([], {
		...nodeFields,
		title: "string",
		height: "number",
		preset: "string",
		data: "array",
		series: "array",
		links: "array",
		palette: "array",
		option: "object"
	}, {}, {
		oneOfRequired: [[
			"option",
			"data",
			"series",
			"links"
		]],
		enums: { preset: ECHART_PRESETS }
	}),
	"file-tree": schema(["items"], {
		...nodeFields,
		items: "array"
	}, { nodes: "items" }, { nested: { items: fileTreeNodeSchema } }),
	grid: schema(["items"], {
		...nodeFields,
		cols: "number",
		items: "nodes"
	}, { columns: "cols" }),
	blocks: schema(["rows"], {
		...nodeFields,
		rows: "array",
		columns: "number",
		caption: "string",
		title: "string"
	}, {
		items: "rows",
		data: "rows"
	}, { nested: { rows: blocksRowSchema } }),
	icon: schema(["name"], {
		...nodeFields,
		name: "string",
		label: "string",
		tone: "string",
		size: "number",
		tile: "boolean"
	}, { icon: "name" }, { enums: { tone: ICON_TONES } }),
	image: schema(["src"], {
		...nodeFields,
		src: "string",
		alt: "string",
		caption: "string"
	}, {
		url: "src",
		link: "src"
	}),
	input: schema([], {
		...nodeFields,
		label: "string",
		placeholder: "string",
		value: "string",
		inputType: "string",
		action: "string",
		id: "string"
	}, {}, { enums: { inputType: INPUT_TYPES } }),
	"date-picker": schema([], {
		...nodeFields,
		label: "string",
		mode: "string",
		value: "string",
		min: "string",
		max: "string",
		id: "string"
	}, {}, { enums: { mode: DATE_PICKER_MODES } }),
	json: schema(["value"], {
		...nodeFields,
		value: "unknown"
	}),
	keyvalue: schema(["pairs"], {
		...nodeFields,
		pairs: "array"
	}, {
		items: "pairs",
		rows: "pairs",
		entries: "pairs"
	}, { nested: { pairs: keyValueRecordSchema } }),
	link: schema(["label"], {
		...nodeFields,
		label: "string",
		href: "string"
	}),
	list: schema(["items"], {
		...nodeFields,
		items: "array",
		filter: "string"
	}),
	map: schema(["locations"], {
		...withoutStyle(nodeFields),
		id: "string",
		title: "string",
		locations: "array",
		routes: "array",
		selected: "string",
		center: "array",
		zoom: "number",
		height: "number"
	}, {}, { nested: {
		locations: recordSchema([
			"id",
			"label",
			"coordinates"
		], {
			id: "string",
			label: "string",
			coordinates: "array",
			description: "string"
		}),
		routes: recordSchema([
			"id",
			"label",
			"coordinates"
		], {
			id: "string",
			label: "string",
			coordinates: "array"
		})
	} }),
	mermaid: schema(["code"], {
		...nodeFields,
		code: "string"
	}),
	svg: schema(["code"], {
		...nodeFields,
		code: "string",
		title: "string",
		height: "number"
	}),
	plot: schema(["series"], {
		...nodeFields,
		series: "array",
		xMin: "number",
		xMax: "number",
		yMin: "number",
		yMax: "number",
		title: "string"
	}, {}, { nested: { series: plotSeriesSchema } }),
	progress: schema(["value"], {
		...nodeFields,
		value: "number",
		label: "string",
		valueLabel: "string",
		variant: "string",
		target: "number"
	}, {}, { enums: { variant: PROGRESS_VARIANTS } }),
	quiz: schema(["question", "options"], {
		...nodeFields,
		question: "string",
		options: "array",
		explanation: "string",
		id: "string",
		action: "string"
	}, {
		title: "question",
		text: "question",
		choices: "options",
		items: "options"
	}),
	radio: schema(["options"], {
		...nodeFields,
		label: "string",
		options: "array",
		selected: "number",
		action: "string",
		group: "string",
		answer: "unknown",
		explanation: "string"
	}, { items: "options" }),
	row: schema(["items"], {
		...nodeFields,
		items: "nodes",
		wrap: "boolean",
		spacer: "boolean",
		justify: "string"
	}, {}, { enums: { justify: ROW_JUSTIFY } }),
	scene3d: schema(["meshes"], {
		...nodeFields,
		title: "string",
		meshes: "array",
		ambient: "number",
		background: "string"
	}, {}, { nested: { meshes: sceneMeshSchema } }),
	select: schema(["options"], {
		...nodeFields,
		label: "string",
		options: "array",
		action: "string",
		selected: "number",
		id: "string"
	}, { items: "options" }),
	"segmented-control": schema(["options"], {
		...nodeFields,
		label: "string",
		options: "array",
		value: "string",
		id: "string",
		action: "string"
	}),
	slider: schema([], {
		...nodeFields,
		label: "string",
		min: "number",
		max: "number",
		step: "number",
		value: "number",
		action: "string",
		id: "string"
	}),
	spacer: schema([], nodeFields),
	hero: schema(["title"], {
		...nodeFields,
		title: "string",
		subtitle: "string",
		value: "string",
		label: "string",
		delta: "string",
		spark: "array",
		tone: "string"
	}, {}, { enums: { tone: HERO_TONES } }),
	stat: schema(["label", "value"], {
		...nodeFields,
		label: "string",
		value: "string",
		delta: "string",
		spark: "array",
		size: "string"
	}, {}, { enums: { size: STAT_SIZES } }),
	steps: schema(["steps"], {
		...nodeFields,
		steps: "array",
		current: "number"
	}, { items: "steps" }, { nested: { steps: stepsRecordSchema } }),
	submit: schema(["label"], {
		...nodeFields,
		label: "string",
		action: "string",
		resetAction: "string",
		groups: "array"
	}),
	switch: schema(["label"], {
		...nodeFields,
		label: "string",
		checked: "boolean",
		action: "string"
	}),
	table: schema(["columns", "rows"], {
		...nodeFields,
		columns: "array",
		rows: "array",
		types: "array",
		total: "boolean",
		details: "array",
		filter: "string",
		filterColumn: "number",
		sortField: "string",
		export: "boolean",
		wrap: "boolean"
	}, {
		headers: "columns",
		data: "rows",
		items: "rows"
	}),
	tabs: schema(["tabs"], {
		...nodeFields,
		tabs: "array"
	}, {}, { nested: { tabs: tabHolderSchema } }),
	text: schema(["content"], {
		...nodeFields,
		content: "string",
		size: "string",
		center: "boolean",
		align: "string",
		tone: "string",
		mono: "boolean"
	}, { text: "content" }, { enums: {
		size: TEXT_SIZES,
		align: TEXT_ALIGNS,
		tone: TEXT_TONES
	} }),
	textarea: schema([], {
		...nodeFields,
		label: "string",
		placeholder: "string",
		rows: "number",
		value: "string",
		action: "string",
		id: "string"
	}),
	timeline: schema(["items"], {
		...nodeFields,
		items: "array"
	}, {}, { nested: { items: timelineRecordSchema } }),
	video: schema(["src"], {
		...nodeFields,
		src: "string",
		alt: "string",
		poster: "string",
		loop: "boolean",
		muted: "boolean",
		aspectRatio: "string"
	}, {
		url: "src",
		link: "src"
	}, { enums: { aspectRatio: MEDIA_ASPECT_RATIOS } })
};
/**
* Every node can carry a `when` condition, so the record schema is attached to
* each component once here instead of being repeated in forty literal entries.
*/
const COMPONENT_SCHEMAS = Object.fromEntries(Object.entries(RAW_COMPONENT_SCHEMAS).map(([type, base]) => [type, {
	...base,
	nested: {
		...base.nested,
		when: whenSchema,
		enableWhen: whenSchema
	}
}]));
const GENUI_NATIVE_TYPES = new Set(Object.keys(COMPONENT_SCHEMAS));
/** Look up only registered components, never Object.prototype properties. */
function getComponentSchema(type) {
	return Object.hasOwn(COMPONENT_SCHEMAS, type) ? COMPONENT_SCHEMAS[type] : void 0;
}
//#endregion
//#region src/client/spec.ts
/**
* GenUI spec language: the declarative component tree a model emits inside a
* ```dsh-ui fence in its reply, which GenuiBlock renders as real interactive
* UI inline in the conversation. The vocabulary is a white list — the renderer
* maps each node to DOM directly, with no arbitrary-HTML path (same
* untrusted-output stance as MarkdownText).
*
* v1 interactivity is client-side only: buttons, tabs, checkboxes, and inputs
* are operable, but events do NOT flow back to the model.
*/
/** 仅用于渲染阶段的表格值，排序读取原始数值，显示读取格式化文字。 */
const GENUI_COMPUTED_CELL = Symbol("dsh-genui-computed-cell");
/** 保存计算后复选框显示文案对应的运行时身份。 */
const GENUI_CHECKBOX_VALUE = Symbol("dsh-genui-checkbox-value");
/**
* Is `value` a bare component root rather than an envelope spec?
*
* A root object carrying a `type` is the documented single-component
* shorthand. `items` alone cannot decide the root shape: for container
* components it holds children (row/col/grid/card/accordion) and for data
* components it holds records (steps/list/timeline/file-tree/breadcrumb), so
* both readings are components. A whitelisted `type` therefore wins over the
* envelope reading — `{"type":"steps","items":[{"title":"…"}]}` is a bare
* steps node, never a spec whose `items` are the step records (issue #172).
* Only the explicit `genui` document marker and the dual native `stack`
* envelope keep the envelope reading. Unknown component names must reach
* validation instead of silently rendering only their children.
*/
function isComponentRoot(value) {
	if (typeof value !== "object" || value === null) return false;
	const v = value;
	if (typeof v.type !== "string" || v.type === "") return false;
	if (!Array.isArray(v.items)) return true;
	return v.type !== "genui" && !(v.type === "stack" && Array.isArray(v.children));
}
/**
* Wrap a bare component object into a one-item spec. Returns null when
* `value` is not component-shaped (no usable `type`). Root-level spec fields
* found on the component are hoisted onto the wrapper: `panel`/`append` (so
* panel routing keeps working) and `title` when the component has no title of
* its own (`{"type":"steps","title":"…"}` means a titled block, not a steps
* field the schema would drop).
*
* The wrapper is a plain spec rather than a `col` node: a spec root is
* already rendered as a column by GenuiBlock, and leaving the wrapper free of
* a component `type` is what stops the guard from reading it as one more bare
* component root and nesting every fence inside a second column (issue #172).
*/
function wrapSingleComponentRoot(value) {
	if (typeof value !== "object" || value === null) return null;
	const v = value;
	if (typeof v.type !== "string" || v.type === "") return null;
	const definition = GENUI_NATIVE_TYPES.has(v.type) ? COMPONENT_SCHEMAS[v.type] : void 0;
	const title = typeof v.title === "string" && definition !== void 0 && !("title" in definition.fields) ? v.title : void 0;
	const node = { ...value };
	if (title !== void 0) delete node.title;
	return {
		items: [node],
		...title !== void 0 ? { title } : {},
		...v.panel === true ? { panel: true } : {},
		...v.append === true ? { append: true } : {}
	};
}
/**
* Basic structural guard: is this object a valid GenuiSpec?
*
* A bare component root is not a spec (it is wrapped instead), so
* `{"type":"steps","items":[…]}` answers false and `parseGenuiSpec` routes it
* through `wrapSingleComponentRoot` (issue #172).
*/
function isGenuiSpec(value) {
	if (typeof value !== "object" || value === null) return false;
	if (isComponentRoot(value)) return false;
	const v = value;
	if (!Array.isArray(v.items)) return false;
	if (v.title !== void 0 && typeof v.title !== "string") return false;
	if (v.gap !== void 0 && typeof v.gap !== "number") return false;
	return true;
}
//#endregion
//#region src/client/genui-runtime/limits.ts
/** Resource limits shared by GenUI repair, validation, and rendering. */
const GENUI_LIMITS = {
	/** Maximum nesting depth of the component tree. */
	maxDepth: 8,
	/** Maximum total nodes across the whole spec. */
	maxNodes: 200,
	/** Maximum length of any plain string field. */
	maxString: 2e3,
	/** Maximum length of a `code` body. */
	maxCode: 12e3,
	/** Copy preview only; clipboard text keeps the existing maxCode limit. */
	maxCopyPreview: 2e3,
	maxCopyPreviewLines: 30,
	/** Maximum length of a mermaid source. */
	maxMermaid: 8e3,
	/** Maximum `grid` columns. */
	maxGridCols: 12,
	/** Maximum `tabs` count. */
	maxTabs: 12,
	/** Bounded gallery/slide counts; carousel children also consume maxNodes. */
	maxCarouselItems: 24,
	maxImageGroupItems: 24,
	/** Maximum `accordion` items. */
	maxAccordionItems: 24,
	/** Maximum `list` items. */
	maxListItems: 50,
	/** Maximum `select`/`radio` options. */
	maxOptions: 50,
	/** Maximum `table` rows / columns. */
	maxTableRows: 50,
	maxTableCols: 12,
	/** Maximum `chart` data points per series. */
	maxChartPoints: 60,
	/** Maximum `plot` series and per-series parameters. */
	maxPlotSeries: 8,
	maxPlotParams: 6,
	/** Maximum computed fields evaluated for one GenUI specification. */
	maxComputedFields: 50,
	/** Maximum `scene3d` meshes. */
	maxMeshes: 5,
	maxMapLocations: 50,
	maxMapRoutes: 8,
	maxMapRoutePoints: 500,
	/** Maximum editable text length and entity-card record counts. */
	maxEditorChars: 12e3,
	maxEntityMetadata: 24,
	maxEntityActions: 8,
	/** Maximum `quiz` options. */
	maxQuizOptions: 8,
	/** Maximum `steps` / `timeline` / `breadcrumb` / `keyvalue` entries. */
	maxSteps: 24,
	maxTimelineItems: 24,
	maxBreadcrumbItems: 12,
	maxKeyValuePairs: 24,
	/** Maximum `file-tree` nesting. */
	maxTreeDepth: 6,
	/** Maximum `blocks` figure rows / cells per row. Cells are data, not nodes,
	*  so a wide figure still costs one node against `maxNodes`. */
	maxBlocksRows: 14,
	maxBlocksCells: 16,
	/** Maximum `diagram` nodes / edges / zones / focal accents. */
	maxDiagramNodes: 9,
	maxDiagramEdges: 12,
	maxDiagramZones: 3,
	maxDiagramFocal: 2,
	maxDiagramLabel: 14,
	/** Maximum depth of an `echart` option object. */
	maxEChartOptionDepth: 10,
	/** Maximum length of any single array inside an `echart` option. */
	maxEChartArrayLen: 500,
	/** Maximum entries traversed while sanitizing an `echart` option. */
	maxEChartOptionNodes: 2e3
};
//#endregion
//#region src/client/table-details.ts
/**
* 使用 table repair 相同的转换规则处理列和行。
*
* @param table - 原始 table 数据。
* @param onRowsTruncated - 有效行被行数上限略过时接收数量的回调。
* @returns 修复后的列和行；无法处理时返回 null。
*/
function prepareTableRows(table, onRowsTruncated) {
	const declaredColumns = table.columns;
	const columnsSpecified = Array.isArray(declaredColumns) && declaredColumns.length > 0;
	let columns = repairColumnValues(columnsSpecified && Array.isArray(declaredColumns) && typeof declaredColumns[0] === "object" && declaredColumns[0] !== null ? declaredColumns.map(columnHeaderText) : declaredColumns);
	let rawRows = table.rows !== void 0 ? table.rows : table.data;
	if (Array.isArray(rawRows) && rawRows.length > 0 && typeof rawRows[0] === "object" && rawRows[0] !== null && !Array.isArray(rawRows[0])) {
		const keys = Array.isArray(table.columns) && table.columns.length > 0 && typeof table.columns[0] === "object" && table.columns[0] !== null ? table.columns.map(columnKeyOf).filter((key) => key !== void 0) : Object.keys(rawRows[0]);
		rawRows = rawRows.map((row) => row !== null && typeof row === "object" && !Array.isArray(row) ? keys.map((key) => cellText(row[key])) : row);
	}
	let derived = null;
	let truncatedRows = 0;
	if (!columnsSpecified && Array.isArray(rawRows) && rawRows.length > 0 && Array.isArray(rawRows[0])) {
		const grid = repairRows(rawRows);
		const candidate = grid.rows.length === 0 ? null : deriveTableColumns(grid.rows);
		if (candidate !== null && repairRows(candidate.rows).rows.length === candidate.rows.length) {
			derived = candidate;
			truncatedRows = grid.truncatedRows;
			columns = candidate.columns.map((column) => column.slice(0, 128));
		}
	}
	if (columns.length === 0 && !Array.isArray(table.columns)) return null;
	const repairedRows = repairRows(derived === null ? rawRows : derived.rows);
	if (derived === null) truncatedRows = repairedRows.truncatedRows;
	if (truncatedRows > 0) onRowsTruncated?.(truncatedRows);
	if (!Array.isArray(rawRows)) return null;
	return {
		columns: columns.slice(0, GENUI_LIMITS.maxTableCols),
		rows: repairedRows.rows
	};
}
/** 返回 repair 后可显示详情的 table 行。 */
function tableRowsForDetails(table) {
	return prepareTableRows(table)?.rows ?? [];
}
/** 按照 table renderer 的规则识别分组标题行。 */
function isTableGroupHeaderRow(row, types) {
	if (!Array.isArray(row) || !Array.isArray(types) || types[0] !== "group") return false;
	return String(row[0] ?? "").trim() !== "" && row.slice(1).every((cell) => String(cell ?? "").trim() === "");
}
/** 判断详情索引对应的行是否可展开并显示。 */
function isTableDetailReachable(table, rowIndex) {
	const rows = tableRowsForDetails(table);
	return rowIndex >= 0 && rowIndex < rows.length && !isTableGroupHeaderRow(rows[rowIndex], table.types);
}
/** 按照 guard 接受的 object alias 规则修复 table 列。 */
function repairColumnValues(value) {
	if (!Array.isArray(value)) return [];
	const columns = [];
	for (const item of value) {
		if (columns.length >= GENUI_LIMITS.maxTableCols) break;
		if (typeof item === "string") columns.push(item.slice(0, 128));
		else if (item !== null && typeof item === "object") {
			const column = item;
			const label = typeof column.label === "string" ? column.label : typeof column.value === "string" ? column.value : typeof column.title === "string" ? column.title : typeof column.name === "string" && column.name !== "" ? column.name : JSON.stringify(item);
			columns.push(label.slice(0, 128));
		}
	}
	return columns;
}
/** 按照 table repair 的单元格规则清理行，并统计行数上限之后的有效行。 */
function repairRows(value) {
	if (!Array.isArray(value)) return {
		rows: [],
		truncatedRows: 0
	};
	const rows = [];
	let truncatedRows = 0;
	for (const row of value) {
		if (!Array.isArray(row)) continue;
		const cells = [];
		for (const cell of row) {
			if (cells.length >= GENUI_LIMITS.maxTableCols) break;
			if (isComputedCell(cell)) cells.push(cell);
			else if (typeof cell === "string") cells.push(cell.slice(0, 256));
			else if (typeof cell === "number" && Number.isFinite(cell)) cells.push(cell);
			else if (cell !== null && typeof cell === "object" && !Array.isArray(cell) && Object.keys(cell).length === 1 && typeof cell.$computed === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(cell.$computed)) cells.push({ $computed: cell.$computed });
		}
		if (cells.length === 0) continue;
		if (rows.length < GENUI_LIMITS.maxTableRows) rows.push(cells);
		else truncatedRows += 1;
	}
	return {
		rows,
		truncatedRows
	};
}
/** 从有效的首行表头生成 table 列。 */
function deriveTableColumns(rows) {
	const header = rows[0];
	if (header === void 0 || header.length === 0) return null;
	const body = rows.slice(1);
	if (body.length === 0) {
		const columns = header.map((cell) => String(cell).trim());
		return columns.every((column) => column !== "") ? {
			columns,
			rows: []
		} : null;
	}
	if (body.every((row) => row.length === header.length)) return {
		columns: header.map((cell) => String(cell).trim()),
		rows: body
	};
	return {
		columns: Array.from({ length: header.length }, (_unused, index) => `列${index + 1}`),
		rows
	};
}
/** 读取 object row 映射到列时使用的 key。 */
function columnKeyOf(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return void 0;
	const column = value;
	for (const key of [
		"key",
		"dataIndex",
		"title",
		"label",
		"name"
	]) if (typeof column[key] === "string" && column[key] !== "") return column[key];
}
/** 将 object row 中的值转换为 table 单元格，并保留列位置。 */
function cellText(value) {
	if (isComputedCell(value)) return value;
	if (typeof value === "string") return value;
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 1 && typeof value.$computed === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(value.$computed)) return { $computed: value.$computed };
	if (value === null || value === void 0) return "";
	return JSON.stringify(value);
}
/** 验证只由 Computed 解析器生成的表格显示单元格。 */
function isComputedCell(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, GENUI_COMPUTED_CELL)) return false;
	const cell = value;
	return cell[GENUI_COMPUTED_CELL] === true && Number.isFinite(cell.value) && typeof cell.formatted === "string";
}
/** 读取 object column 显示的标题。 */
function columnHeaderText(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return String(value);
	const column = value;
	for (const key of [
		"title",
		"label",
		"key",
		"dataIndex",
		"name"
	]) if (typeof column[key] === "string" && column[key] !== "") return column[key];
	return JSON.stringify(value);
}
//#endregion
//#region src/client/genui-runtime/normalize.ts
/** Deterministic GenUI alias and structural normalization. */
function record$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
/**
* Resolve an explicit component type or a type uniquely identified by fields.
*
* @param value - Value to inspect without changing it.
* @returns The explicit or inferred component type when available.
*/
function nodeTypeOf(value) {
	const candidate = record$1(value);
	if (candidate === void 0) return void 0;
	if (typeof candidate.type === "string") return candidate.type;
	if ("type" in candidate) return void 0;
	const matches = [];
	if (Array.isArray(candidate.columns) && Array.isArray(candidate.rows)) matches.push("table");
	if (Array.isArray(candidate.pairs)) matches.push("keyvalue");
	if (Array.isArray(candidate.steps)) matches.push("steps");
	if (Array.isArray(candidate.diffs)) matches.push("diff");
	if (Array.isArray(candidate.meshes)) matches.push("scene3d");
	if (Array.isArray(candidate.tabs)) matches.push("tabs");
	return matches.length === 1 ? matches[0] : void 0;
}
/**
* Check whether a value can be treated as a component node.
*
* @param value - Value to inspect without changing it.
* @returns Whether the value has an explicit or uniquely inferred type.
*/
function isNode$1(value) {
	return nodeTypeOf(value) !== void 0;
}
/** Fields a `stat` keeps when a metric record is folded into its own node. */
const STAT_METRIC_FIELDS = [
	"label",
	"value",
	"delta",
	"spark",
	"size"
];
const LIST_ITEM_ALIASES = {
	label: "title",
	name: "title",
	description: "desc",
	content: "desc",
	text: "desc",
	body: "desc",
	detail: "desc"
};
/**
* Normalize one metric record of a stat group into a single-metric `stat`
* node, or null when the entry is not a metric at all.
*/
function statMetricsOf(entries, path, normalizeChild) {
	if (entries.length === 0) return null;
	const metrics = [];
	for (let index = 0; index < entries.length; index++) {
		const entry = entries[index];
		const metric = record$1(entry);
		if (metric === void 0) return null;
		if (isNode$1(entry)) {
			metrics.push(normalizeChild(entry, `${path}.items[${index}]`));
			continue;
		}
		if (typeof metric.label !== "string" && typeof metric.value !== "string") return null;
		const stat = { type: "stat" };
		for (const field of STAT_METRIC_FIELDS) if (metric[field] !== void 0) stat[field] = metric[field];
		metrics.push(stat);
	}
	return metrics;
}
function normalizeAliasFields(value, path, type, warnings) {
	const definition = getComponentSchema(type);
	if (definition === void 0) return value;
	const out = { ...value };
	for (const [alias, canonical] of Object.entries(definition.aliases)) {
		if (!(alias in out)) continue;
		const aliasPath = `${path}.${alias}`;
		const keptCanonical = canonical in out;
		if (!keptCanonical) out[canonical] = out[alias];
		delete out[alias];
		warnings.push({
			kind: "alias",
			path: aliasPath,
			message: keptCanonical ? `${aliasPath} is ignored because canonical field '${canonical}' is present` : `${aliasPath} normalized/adopted as '${canonical}'`,
			type,
			field: alias,
			canonical
		});
	}
	for (const [field, values] of Object.entries(definition.valueAliases)) {
		const written = out[field];
		if (typeof written !== "string") continue;
		const canonical = Object.hasOwn(values, written) ? values[written] : void 0;
		if (canonical === void 0 || canonical === written) continue;
		out[field] = canonical;
		warnings.push({
			kind: "alias",
			path: `${path}.${field}`,
			message: `${path}.${field} '${written}' normalized to '${canonical}'`,
			type,
			field,
			canonical
		});
	}
	return out;
}
/**
* Apply a nested record schema's field aliases to a record tree: every entry
* of an array (and every nested record collection below it) is rewritten in
* place-equivalent copies, so validation, repair, and diagnostics all see the
* canonical record fields (`keyvalue.pairs[].label → key`,
* `file-tree.items[].label → name`, issue #186).
*/
function normalizeRecordTree(value, definition, at, type, warnings) {
	if (Array.isArray(value)) return value.map((entry, index) => normalizeRecordTree(entry, definition, `${at}[${index}]`, type, warnings));
	const holder = record$1(value);
	if (holder === void 0) return value;
	const out = { ...holder };
	for (const [alias, canonical] of Object.entries(definition.aliases)) {
		if (!(alias in out)) continue;
		const keptCanonical = canonical in out;
		if (!keptCanonical) out[canonical] = out[alias];
		delete out[alias];
		warnings.push({
			kind: "alias",
			path: `${at}.${alias}`,
			message: keptCanonical ? `${at}.${alias} is ignored because canonical field '${canonical}' is present` : `${at}.${alias} normalized/adopted as '${canonical}'`,
			type,
			field: alias,
			canonical
		});
	}
	for (const [field, nested] of Object.entries(definition.nested)) if (out[field] !== void 0) out[field] = normalizeRecordTree(out[field], nested, `${at}.${field}`, type, warnings);
	return out;
}
/**
* file-tree parents without a `type`: a record that carries `children` is a
* directory in every model-written tree, and the renderer's collapse
* affordance depends on the marker (issue #186).
*/
function defaultFileTreeDirectories(value) {
	if (Array.isArray(value)) return value.map(defaultFileTreeDirectories);
	const holder = record$1(value);
	if (holder === void 0) return value;
	const out = { ...holder };
	if (out.type === void 0 && Array.isArray(out.children)) out.type = "dir";
	if (out.children !== void 0) out.children = defaultFileTreeDirectories(out.children);
	return out;
}
/**
* Normalize one component node and its renderer-reachable children.
*
* @param value - Raw component or other value.
* @param path - Stable diagnostic path for this node.
* @param warnings - Alias and structural normalization diagnostics.
* @returns The normalized component, or the original value when it is not a node.
*/
function normalizeNode(value, path, warnings) {
	const type = nodeTypeOf(value);
	const candidate = record$1(value);
	if (type === void 0 || candidate === void 0) return value;
	const node = typeof candidate.type === "string" ? candidate : {
		...candidate,
		type
	};
	const definition = getComponentSchema(type);
	if (definition === void 0) return node;
	const out = normalizeAliasFields(node, path, type, warnings);
	for (const [field, nested] of Object.entries(definition.nested)) {
		if (out[field] === void 0) continue;
		const nestedValue = out[field];
		const cap = type === "image-group" && field === "items" ? GENUI_LIMITS.maxImageGroupItems : type === "entity-card" && field === "metadata" ? GENUI_LIMITS.maxEntityMetadata : type === "entity-card" && field === "actions" ? GENUI_LIMITS.maxEntityActions : type === "map" && field === "locations" ? GENUI_LIMITS.maxMapLocations : type === "map" && field === "routes" ? GENUI_LIMITS.maxMapRoutes : void 0;
		if (cap !== void 0 && Array.isArray(nestedValue)) out[field] = [...normalizeRecordTree(nestedValue.slice(0, cap), nested, `${path}.${field}`, type, warnings), ...nestedValue.slice(cap)];
		else out[field] = normalizeRecordTree(nestedValue, nested, `${path}.${field}`, type, warnings);
	}
	const normalizeNodeValue = (child, childPath) => normalizeNode(child, childPath, warnings);
	const normalizeNodeArray = (children, childPath) => Array.isArray(children) ? children.map((child, index) => normalizeNodeValue(child, `${childPath}[${index}]`)) : children;
	if (type === "file-tree" && out.items !== void 0) out.items = defaultFileTreeDirectories(out.items);
	if (type === "stat" && Array.isArray(out.items) && out.label === void 0 && out.value === void 0) {
		const metrics = statMetricsOf(out.items, path, normalizeNodeValue);
		if (metrics !== null) {
			warnings.push({
				kind: "alias",
				path: `${path}.items`,
				message: `${path}.items normalized into a row of 'stat' nodes`,
				type,
				field: "items",
				canonical: "row"
			});
			return {
				type: "row",
				items: metrics,
				...out.span !== void 0 ? { span: out.span } : {}
			};
		}
	}
	if (type === "row" || type === "col" || type === "grid" || type === "card" || type === "carousel" || type === "file-tree" || type === "timeline" || type === "breadcrumb") {
		if (type !== "file-tree" && type !== "timeline" && type !== "breadcrumb") {
			if (type === "carousel" && Array.isArray(out.items)) out.items = [...normalizeNodeArray(out.items.slice(0, GENUI_LIMITS.maxCarouselItems), `${path}.items`), ...out.items.slice(GENUI_LIMITS.maxCarouselItems)];
			else out.items = normalizeNodeArray(out.items, `${path}.items`);
		}
	} else if (type === "list" && Array.isArray(out.items)) out.items = out.items.map((child, index) => {
		if (isNode$1(child)) return normalizeNodeValue(child, `${path}.items[${index}]`);
		if (Array.isArray(child) && child.length === 1 && typeof child[0] === "string") return child[0];
		const holder = record$1(child);
		if (holder === void 0) return child;
		const normalizedHolder = { ...holder };
		const itemPath = `${path}.items[${index}]`;
		for (const [alias, canonical] of Object.entries(LIST_ITEM_ALIASES)) {
			if (!(alias in normalizedHolder)) continue;
			const keptCanonical = canonical in normalizedHolder;
			if (!keptCanonical) normalizedHolder[canonical] = normalizedHolder[alias];
			delete normalizedHolder[alias];
			warnings.push({
				kind: "alias",
				path: `${itemPath}.${alias}`,
				type,
				field: alias,
				canonical,
				message: keptCanonical ? `${itemPath}.${alias} is ignored because canonical field '${canonical}' is present` : `${itemPath}.${alias} normalized/adopted as '${canonical}'`
			});
		}
		if (!("title" in normalizedHolder) && typeof normalizedHolder.desc === "string") {
			normalizedHolder.title = normalizedHolder.desc;
			delete normalizedHolder.desc;
			warnings.push({
				kind: "alias",
				path: `${itemPath}.desc`,
				type,
				field: "desc",
				canonical: "title",
				message: `${itemPath}.desc normalized/adopted as 'title'`
			});
		}
		return normalizedHolder;
	});
	else if (type === "keyvalue" && Array.isArray(out.pairs)) {
		if (out.pairs.length > 0 && out.pairs.every((pair) => Array.isArray(pair))) out.pairs = out.pairs.map((pair) => {
			const cells = pair;
			return {
				key: cells[0],
				value: cells.length > 1 ? cells[1] : ""
			};
		});
	} else if (type === "tabs" && Array.isArray(out.tabs)) out.tabs = out.tabs.map((tab, index) => {
		const holder = record$1(tab);
		if (holder === void 0) return tab;
		const normalizedHolder = { ...holder };
		if ("content" in normalizedHolder) {
			const tabPath = `${path}.tabs[${index}].content`;
			const hasItems = "items" in normalizedHolder;
			if (!hasItems) normalizedHolder.items = normalizedHolder.content;
			delete normalizedHolder.content;
			warnings.push({
				kind: "alias",
				path: tabPath,
				message: hasItems ? `${tabPath} is ignored because canonical field 'items' is present` : `${tabPath} normalized/adopted as 'items'`,
				type,
				field: "content",
				canonical: "items"
			});
		}
		if (normalizedHolder.items !== void 0) normalizedHolder.items = Array.isArray(normalizedHolder.items) ? normalizedHolder.items.map((child, childIndex) => normalizeNodeValue(child, `${path}.tabs[${index}].items[${childIndex}]`)) : [normalizeNodeValue(normalizedHolder.items, `${path}.tabs[${index}].items[0]`)];
		return normalizedHolder;
	});
	else if (type === "accordion" && Array.isArray(out.items)) out.items = out.items.map((item, index) => {
		const holder = record$1(item);
		if (holder === void 0) return item;
		return {
			...holder,
			items: Array.isArray(holder.items) ? holder.items.map((child, childIndex) => normalizeNodeValue(child, `${path}.items[${index}].items[${childIndex}]`)) : holder.items
		};
	});
	else if (type === "table" && Array.isArray(out.details)) {
		const table = {
			columns: out.columns,
			rows: out.rows,
			types: out.types
		};
		out.details = out.details.map((detail, rowIndex) => {
			if (!Array.isArray(detail) || !isTableDetailReachable(table, rowIndex)) return detail;
			return detail.map((child, childIndex) => normalizeNodeValue(child, `${path}.details[${rowIndex}][${childIndex}]`));
		});
	}
	return out;
}
/**
* Normalize a raw GenUI value into canonical field names.
*
* Only deterministic aliases and structural aliases are changed. Resource
* limits, type repair, security filtering, and semantic validation remain in
* the guard layer. Unknown component types are returned opaque.
*
* @param value - Raw GenUI spec or bare native component.
* @returns Canonical value and stable alias diagnostics.
*/
function normalizeGenuiSpec(value) {
	const warnings = [];
	if (typeof value === "string") try {
		const decoded = JSON.parse(value);
		if (record$1(decoded) !== void 0 || Array.isArray(decoded)) {
			value = decoded;
			warnings.push({
				kind: "alias",
				path: "spec",
				message: "double-encoded JSON string unwrapped into a spec value"
			});
		}
	} catch {}
	if (Array.isArray(value) && value.length > 0) {
		value = { items: value };
		warnings.push({
			kind: "alias",
			path: "items",
			message: "root array normalized into an items envelope"
		});
	}
	const root = record$1(value);
	if (root === void 0) return {
		value,
		warnings
	};
	const out = { ...root };
	if (isComponentRoot(out)) return {
		value: normalizeNode(out, "spec", warnings),
		warnings
	};
	if (Array.isArray(out.items)) out.items = out.items.map((item, index) => normalizeNode(item, `items[${index}]`, warnings));
	return {
		value: out,
		warnings
	};
}
//#endregion
//#region src/client/genui-runtime/diagnostics.ts
/** GenUI runtime diagnostics for aliases and unknown fields. */
function record(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function isNode(value) {
	const candidate = record(value);
	return candidate !== void 0 && typeof candidate.type === "string";
}
function visitNativeNodes(value, path, visit) {
	if (!isNode(value)) return;
	const type = value.type;
	const definition = getComponentSchema(type);
	if (definition === void 0) return;
	visit(value, path, definition);
	const children = (child, childPath) => visitNativeNodes(child, childPath, visit);
	if ((type === "row" || type === "col" || type === "grid" || type === "card" || type === "carousel") && Array.isArray(value.items)) (type === "carousel" ? value.items.slice(0, GENUI_LIMITS.maxCarouselItems) : value.items).forEach((child, index) => children(child, `${path}.items[${index}]`));
	else if (type === "list" && Array.isArray(value.items)) value.items.forEach((child, index) => children(child, `${path}.items[${index}]`));
	else if (type === "tabs" && Array.isArray(value.tabs)) value.tabs.forEach((tab, index) => {
		const holder = record(tab);
		if (holder === void 0) return;
		if (Array.isArray(holder.items)) holder.items.forEach((child, childIndex) => children(child, `${path}.tabs[${index}].items[${childIndex}]`));
		else children(holder.items, `${path}.tabs[${index}].items`);
	});
	else if (type === "accordion" && Array.isArray(value.items)) value.items.forEach((item, index) => {
		const holder = record(item);
		if (holder?.items !== void 0 && Array.isArray(holder.items)) holder.items.forEach((child, childIndex) => children(child, `${path}.items[${index}].items[${childIndex}]`));
	});
	else if (type === "table" && Array.isArray(value.details)) {
		const table = {
			columns: value.columns,
			rows: value.rows,
			types: value.types
		};
		value.details.forEach((detail, rowIndex) => {
			if (Array.isArray(detail) && isTableDetailReachable(table, rowIndex)) detail.forEach((child, childIndex) => children(child, `${path}.details[${rowIndex}][${childIndex}]`));
		});
	}
}
function pushUnknownField(warnings, path, field, type) {
	warnings.push({
		kind: "unknown-field",
		path: `${path}.${field}`,
		message: `${path}.${field}: unknown field for '${type}'`,
		type,
		field
	});
}
function diagnoseRecordFields(value, path, definition, type, warnings) {
	const holder = record(value);
	if (holder === void 0) return;
	for (const field of Object.keys(holder)) {
		if (field in definition.fields) continue;
		pushUnknownField(warnings, path, field, type);
	}
	for (const [field, nested] of Object.entries(definition.nested)) {
		const nestedValue = holder[field];
		if (Array.isArray(nestedValue)) nestedValue.forEach((item, index) => diagnoseRecordFields(item, `${path}.${field}[${index}]`, nested, type, warnings));
		else if (nestedValue !== void 0) diagnoseRecordFields(nestedValue, `${path}.${field}`, nested, type, warnings);
	}
}
function diagnoseNestedFields(node, path, definition, warnings) {
	for (const [field, nested] of Object.entries(definition.nested)) {
		const nestedValue = node[field];
		if (Array.isArray(nestedValue)) (node.type === "image-group" && field === "items" ? nestedValue.slice(0, GENUI_LIMITS.maxImageGroupItems) : node.type === "entity-card" && field === "metadata" ? nestedValue.slice(0, GENUI_LIMITS.maxEntityMetadata) : node.type === "entity-card" && field === "actions" ? nestedValue.slice(0, GENUI_LIMITS.maxEntityActions) : node.type === "map" && field === "locations" ? nestedValue.slice(0, GENUI_LIMITS.maxMapLocations) : node.type === "map" && field === "routes" ? nestedValue.slice(0, GENUI_LIMITS.maxMapRoutes) : nestedValue).forEach((item, index) => diagnoseRecordFields(item, `${path}.${field}[${index}]`, nested, node.type, warnings));
		else if (nestedValue !== void 0) diagnoseRecordFields(nestedValue, `${path}.${field}`, nested, node.type, warnings);
	}
}
/**
* Diagnose unknown direct fields on native nodes.
*
* Unknown types are intentionally skipped so custom renderers retain their
* opaque extension payloads. Native unknown fields are warnings, not errors.
*
* @param value - Canonical or raw GenUI value.
* @returns Stable field diagnostics in tree order.
*/
function diagnoseUnknownGenuiFields(value) {
	const warnings = [];
	const root = record(value);
	if (root === void 0) return warnings;
	const visit = (node, path, definition) => {
		for (const field of Object.keys(node)) {
			if (field === "type" || field in definition.fields) continue;
			pushUnknownField(warnings, path, field, node.type);
		}
		diagnoseNestedFields(node, path, definition, warnings);
		if (node.type === "list" && Array.isArray(node.items)) node.items.forEach((item, index) => {
			if (isNode(item)) return;
			const holder = record(item);
			if (holder === void 0) return;
			for (const field of Object.keys(holder)) {
				if (field === "title" || field === "desc") continue;
				const itemPath = `${path}.items[${index}]`;
				warnings.push({
					kind: "unknown-field",
					path: `${itemPath}.${field}`,
					message: `${itemPath}.${field}: list items render 'title' and 'desc' only — '${field}' is dropped`,
					type: "list",
					field
				});
			}
		});
	};
	if (Array.isArray(root.items) && !isComponentRoot(root)) {
		for (const field of Object.keys(root)) {
			if (field in GENUI_SPEC_SCHEMA.fields) continue;
			if (root.type === "stack" && Array.isArray(root.children) && (field === "type" || field === "children")) continue;
			pushUnknownField(warnings, "spec", field, "spec");
		}
		root.items.forEach((item, index) => visitNativeNodes(item, `items[${index}]`, visit));
	} else if (typeof root.type === "string") visitNativeNodes(root, "spec", visit);
	else for (const field of Object.keys(root)) {
		if (field in GENUI_SPEC_SCHEMA.fields) continue;
		pushUnknownField(warnings, "spec", field, "spec");
	}
	return warnings;
}
//#endregion
//#region src/client/date-picker.ts
/** 校验 ISO 日期是否对应真实日历日期。 */
function isIsoDate(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return false;
	const parsed = /* @__PURE__ */ new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
/** 校验日期或日期区间是否完整、有序且处于可选范围内。 */
function isDatePickerValueValid(value, mode, min, max) {
	const dates = value.split("/");
	if (dates.length !== (mode === "range" ? 2 : 1) || !dates.every(isIsoDate)) return false;
	const [start, end] = dates;
	if (end !== void 0 && start > end) return false;
	if (min !== void 0 && (!isIsoDate(min) || dates.some((date) => date < min))) return false;
	if (max !== void 0 && (!isIsoDate(max) || dates.some((date) => date > max))) return false;
	return true;
}
//#endregion
//#region src/client/walk-spec.ts
/** 遍历完整 GenUI 组件树，并提供节点路径和祖先条件来源。 */
function walkGenuiNodes(spec, visitor) {
	const walk = (nodes, path, depth, ancestorConditions) => {
		if (depth > GENUI_LIMITS.maxDepth) return;
		nodes.forEach((node, index) => visit(node, `${path}[${index}]`, depth, ancestorConditions));
	};
	const visit = (node, at, depth, ancestorConditions) => {
		if (depth > GENUI_LIMITS.maxDepth) return;
		visitor(node, at, ancestorConditions);
		if (depth >= GENUI_LIMITS.maxDepth) return;
		const childConditions = node.when === void 0 ? ancestorConditions : [...ancestorConditions, {
			condition: node.when,
			path: `${at}.when.field`
		}];
		switch (node.type) {
			case "row":
			case "col":
			case "grid":
			case "card":
				walk(node.items, `${at}.items`, depth + 1, childConditions);
				break;
			case "carousel":
				walk(node.items.slice(0, GENUI_LIMITS.maxCarouselItems), `${at}.items`, depth + 1, childConditions);
				break;
			case "tabs":
				node.tabs.forEach((tab, tabIndex) => walk(tab.items, `${at}.tabs[${tabIndex}].items`, depth + 1, childConditions));
				break;
			case "accordion":
				node.items.forEach((item, itemIndex) => walk(item.items, `${at}.items[${itemIndex}].items`, depth + 1, childConditions));
				break;
			case "list":
				node.items.forEach((item, itemIndex) => {
					if (item !== null && typeof item === "object" && "type" in item) visit(item, `${at}.items[${itemIndex}]`, depth + 1, childConditions);
				});
				break;
			case "table": node.details?.slice(0, tableRowsForDetails(node).length).forEach((detail, rowIndex) => {
				if (detail !== null && isTableDetailReachable(node, rowIndex)) walk(detail, `${at}.details[${rowIndex}]`, depth + 1, childConditions);
			});
		}
	};
	walk(spec.items, "items", 0, []);
}
//#endregion
//#region src/client/submission-registry.ts
/** 从 spec 建立成员表，并诊断 submission key 和 submit.groups。 */
function analyzeSubmissionRegistry(spec, allowExternalGroups = false) {
	const members = /* @__PURE__ */ new Map();
	const paths = /* @__PURE__ */ new Map();
	const diagnostics = [];
	const submits = [];
	walkGenuiNodes(spec, (node, path) => {
		if (node.type === "submit") {
			if (node.groups !== void 0) submits.push({
				groups: node.groups,
				path
			});
			return;
		}
		let member;
		let keyPath;
		switch (node.type) {
			case "radio":
				if (node.group === void 0) return;
				member = {
					kind: "radio",
					key: node.group,
					label: node.label ?? node.group,
					options: node.options.slice(0, GENUI_LIMITS.maxOptions),
					...node.answer === void 0 ? {} : { answer: node.answer },
					...node.explanation === void 0 ? {} : { explanation: node.explanation }
				};
				keyPath = `${path}.group`;
				break;
			case "choices":
				if (node.group === void 0) return;
				member = {
					kind: "radio",
					key: node.group,
					label: node.title ?? node.prompt ?? node.group,
					options: node.items.map((item) => item.label).slice(0, GENUI_LIMITS.maxOptions),
					...node.answer === void 0 ? {} : { answer: node.answer },
					...node.explanation === void 0 ? {} : { explanation: node.explanation }
				};
				keyPath = `${path}.group`;
				break;
			case "checkbox":
				if (node.group === void 0) return;
				member = {
					kind: "checkbox",
					key: node.group,
					choices: /* @__PURE__ */ new Map([[node[GENUI_CHECKBOX_VALUE] ?? node.label, node.label]])
				};
				keyPath = `${path}.group`;
				break;
			case "input":
			case "textarea":
			case "editor":
			case "select":
			case "slider":
			case "date-picker":
			case "segmented-control":
			case "map":
			case "diagram":
				if (node.id === void 0) return;
				member = {
					kind: "field",
					key: node.id,
					fieldType: node.type,
					secret: node.type === "input" && node.inputType === "password",
					...node.type === "date-picker" ? { datePicker: {
						mode: node.mode ?? "single",
						...node.min === void 0 ? {} : { min: node.min },
						...node.max === void 0 ? {} : { max: node.max }
					} } : {}
				};
				keyPath = `${path}.id`;
				break;
			default: return;
		}
		if (member === void 0) return;
		const existing = members.get(member.key);
		if (existing !== void 0) {
			if (existing.kind !== "checkbox" || member.kind !== "checkbox") diagnostics.push(`${keyPath} conflicts with ${paths.get(member.key)}: submission key '${member.key}' is already used`);
			else for (const [value, label] of member.choices) existing.choices.set(value, label);
			return;
		}
		members.set(member.key, member);
		paths.set(member.key, keyPath);
	});
	for (const { groups, path } of submits) {
		const seen = /* @__PURE__ */ new Set();
		groups.forEach((key, index) => {
			const at = `${path}.groups[${index}]`;
			if (seen.has(key)) diagnostics.push(`${at}: duplicate submission member '${key}'`);
			seen.add(key);
			const member = members.get(key);
			if (member === void 0 && !allowExternalGroups) diagnostics.push(`${at}: submit.groups references unknown submission member '${key}'`);
			else if (member?.kind === "field" && member.secret) diagnostics.push(`${at}: submit.groups cannot require secret field '${key}'`);
		});
	}
	return {
		registry: { members },
		diagnostics
	};
}
/** 编译供运行时读取的静态 submission 成员表。 */
function compileSubmissionRegistry(spec) {
	return analyzeSubmissionRegistry(spec).registry;
}
/** 根据当前交互状态判断一个 submission member 是否完成。 */
function isSubmissionMemberAnswered(member, state) {
	switch (member.kind) {
		case "radio": return state.answers[member.key] !== void 0;
		case "checkbox": return state.multiAnswers[member.key]?.some((value) => member.choices.has(value)) ?? false;
		case "field": {
			if (member.secret) return false;
			if (!Object.hasOwn(state.fields, member.key)) return false;
			const value = state.fields[member.key];
			if (value === void 0 || value.trim() === "") return false;
			if (member.fieldType === "date-picker") return isDatePickerValueValid(value, member.datePicker?.mode ?? "single", member.datePicker?.min, member.datePicker?.max);
			return true;
		}
	}
}
/** 计算 submit 进度和纯本地判卷条件。 */
function resolveSubmitState({ registry, groups, state }) {
	const hidden = state.hidden ?? /* @__PURE__ */ new Set();
	const isHidden = (member) => hidden.has(member.key);
	const hasUnknownMember = groups?.some((key) => !registry.members.has(key) && !hidden.has(key)) ?? false;
	const scope = groups === void 0 ? [...registry.members.values()].filter((member) => !isHidden(member) && isSubmissionMemberAnswered(member, state)) : groups.flatMap((key) => {
		const member = registry.members.get(key);
		return member === void 0 ? [] : [member];
	});
	const answered = scope.filter((member) => isSubmissionMemberAnswered(member, state)).length;
	const total = groups === void 0 ? scope.length : groups.filter((key) => !hidden.has(key)).length;
	const scopeKeys = new Set(scope.map((member) => member.key));
	const hasOutOfScopePayload = Object.keys(state.answers).some((key) => !scopeKeys.has(key)) || Object.keys(state.multiAnswers).some((key) => !scopeKeys.has(key)) || Object.entries(state.fields).some(([key, value]) => {
		if (value.trim() === "" || state.secretFields.has(key) || scopeKeys.has(key)) return false;
		const member = registry.members.get(key);
		return member?.kind !== "field" || member.fieldType !== "date-picker" || isSubmissionMemberAnswered(member, state);
	});
	return {
		scope,
		answered,
		total,
		localGradeEligible: !hasUnknownMember && scope.length > 0 && scope.every((member) => member.kind === "radio") && scope.some((member) => member.kind === "radio" && member.answer !== void 0),
		hasOutOfScopePayload
	};
}
//#endregion
//#region src/client/genui-runtime/value-utils.ts
/** Shared primitive sanitizers used by the GenUI guard. */
/** Is `value` one of `values`? */
function inEnum(value, values) {
	return typeof value === "string" && values.includes(value);
}
/** String field: truncate a string to `cap`, or undefined when not a string. */
function str(value, cap) {
	return typeof value === "string" ? value.slice(0, cap) : void 0;
}
/**
* Color field: the value lands in an inline `style` (background/stroke) or
* THREE.Color. Arbitrary CSS values are an exfiltration channel, so only
* literal color formats and host design tokens are accepted.
*/
const SAFE_COLOR_RE = /^(?:#[\da-fA-F]{3,8}|rgba?\([^)]{0,64}\)|hsla?\([^)]{0,64}\)|var\(--dsw-[\w-]+(?:,\s*#[0-9a-fA-F]{3,8})?\))$/;
function color(value) {
	if (typeof value !== "string") return void 0;
	const normalized = value.trim();
	return normalized.length <= 64 && SAFE_COLOR_RE.test(normalized) ? normalized : void 0;
}
/** Keep only http(s) and mailto link targets. */
function safeHref(value) {
	if (typeof value !== "string") return void 0;
	const normalized = value.trim();
	if (normalized.length > 2048) return void 0;
	return /^https?:\/\//i.test(normalized) || /^mailto:[^@\s]+@[^@\s]+$/i.test(normalized) ? normalized : void 0;
}
/** Keep browser-reachable http(s) or same-origin relative media paths. */
function safeMediaSrc(value) {
	if (typeof value !== "string") return void 0;
	if (/[\u0000-\u001f\u007f]/.test(value)) return void 0;
	const normalized = value.trim();
	if (normalized === "" || normalized.length > 2048) return void 0;
	if (/^https?:\/\//i.test(normalized)) return normalized;
	if (/^[a-z][a-z0-9+.-]*:/i.test(normalized) || /^[/\\]{2}/.test(normalized)) return void 0;
	return normalized;
}
/** Finite-number field: clamp into [min, max], or undefined when not finite. */
function num(value, min, max) {
	return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : void 0;
}
/** Integer field: clamp into [min, max], or undefined when not a finite number. */
function int(value, min, max) {
	return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : void 0;
}
/** Optional enum field: the value when it matches, otherwise undefined. */
function enu(value, values) {
	return inEnum(value, values) ? value : void 0;
}
/** Plain object (not array, not null). */
function obj(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
/** Preserve an optional field only when its value exists. */
function opt(key, value) {
	return value === void 0 ? {} : { [key]: value };
}
//#endregion
//#region src/client/map-data.ts
/** Bounded geographic data shared by the guard and direct renderer callers. */
function mapCoordinate(value) {
	if (!Array.isArray(value) || value.length !== 2) return void 0;
	const [lng, lat] = value;
	return typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180 && typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90 ? [lng, lat] : void 0;
}
function mapId(value) {
	return typeof value === "string" && value.trim() !== "" && value.length <= 200 ? value : void 0;
}
function repairMap(value) {
	const v = obj(value);
	if (v === void 0 || !Array.isArray(v.locations)) return null;
	const ids = /* @__PURE__ */ new Set();
	const locations = [];
	for (const raw of v.locations.slice(0, GENUI_LIMITS.maxMapLocations)) {
		const item = obj(raw);
		if (item === void 0) continue;
		const id = mapId(item.id), label = str(item.label, GENUI_LIMITS.maxString), coordinates = mapCoordinate(item.coordinates);
		if (id === void 0 || label === void 0 || coordinates === void 0 || ids.has(id)) continue;
		ids.add(id);
		locations.push({
			id,
			label,
			coordinates,
			...opt("description", str(item.description, GENUI_LIMITS.maxString))
		});
	}
	const routeIds = /* @__PURE__ */ new Set();
	const routes = [];
	if (Array.isArray(v.routes)) for (const raw of v.routes.slice(0, GENUI_LIMITS.maxMapRoutes)) {
		const route = obj(raw);
		if (route === void 0) continue;
		const id = mapId(route.id), label = str(route.label, GENUI_LIMITS.maxString);
		if (id === void 0 || label === void 0 || routeIds.has(id) || !Array.isArray(route.coordinates) || route.coordinates.length < 2 || route.coordinates.length > GENUI_LIMITS.maxMapRoutePoints) continue;
		const coordinates = route.coordinates.map(mapCoordinate);
		if (coordinates.some((point) => point === void 0)) continue;
		routeIds.add(id);
		routes.push({
			id,
			label,
			coordinates
		});
	}
	const selected = mapId(v.selected);
	return {
		type: "map",
		locations,
		...opt("id", mapId(v.id)),
		...opt("title", str(v.title, GENUI_LIMITS.maxString)),
		...opt("selected", selected !== void 0 && ids.has(selected) ? selected : void 0),
		...opt("center", mapCoordinate(v.center)),
		...opt("zoom", num(v.zoom, 0, 20)),
		...opt("height", int(v.height, 200, 640)),
		...routes.length > 0 ? { routes } : {}
	};
}
function validateMap(v, at, errors) {
	if (!Array.isArray(v.locations)) errors.push(`${at}: type 'map' requires locations (array)`);
	if (v.routes !== void 0 && !Array.isArray(v.routes)) errors.push(`${at}.routes must be an array`);
	const ids = /* @__PURE__ */ new Set();
	for (const [field, limit] of [["locations", GENUI_LIMITS.maxMapLocations], ["routes", GENUI_LIMITS.maxMapRoutes]]) {
		const entries = v[field];
		if (!Array.isArray(entries)) continue;
		if (entries.length > limit) errors.push(`${at}.${field} exceeds ${limit} entries`);
		const seen = /* @__PURE__ */ new Set();
		entries.slice(0, limit).forEach((raw, index) => {
			const item = obj(raw), path = `${at}.${field}[${index}]`;
			if (item === void 0) {
				errors.push(`${path} must be an object`);
				return;
			}
			if (typeof item.label !== "string") errors.push(`${path}.label must be a string`);
			if (mapId(item.id) === void 0) errors.push(`${path}.id must be a non-empty string of at most 200 characters`);
			else if (seen.has(item.id)) errors.push(`${path}.id must be unique`);
			else {
				seen.add(item.id);
				if (field === "locations") ids.add(item.id);
			}
			if (field === "locations") {
				if (mapCoordinate(item.coordinates) === void 0) errors.push(`${path}.coordinates must be [longitude, latitude] in [-180,180] × [-90,90]`);
			} else if (!Array.isArray(item.coordinates) || item.coordinates.length < 2 || item.coordinates.length > GENUI_LIMITS.maxMapRoutePoints || item.coordinates.some((point) => mapCoordinate(point) === void 0)) errors.push(`${path}.coordinates must contain 2–${GENUI_LIMITS.maxMapRoutePoints} valid [longitude, latitude] pairs`);
		});
	}
	if (v.id !== void 0 && mapId(v.id) === void 0) errors.push(`${at}.id must be a non-empty string of at most 200 characters`);
	if (v.selected !== void 0 && (typeof v.selected !== "string" || !ids.has(v.selected))) errors.push(`${at}.selected must reference a location id`);
	if (v.center !== void 0 && mapCoordinate(v.center) === void 0) errors.push(`${at}.center must be valid [longitude, latitude]`);
	for (const [field, min, max] of [[
		"zoom",
		0,
		20
	], [
		"height",
		200,
		640
	]]) {
		const n = v[field];
		if (n !== void 0 && (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)) errors.push(`${at}.${field} must be between ${min} and ${max}`);
	}
}
//#endregion
//#region src/client/file-link.ts
/** Decode a local file destination and its optional first line fragment. */
function parseFileLink(value) {
	if (value.length > 2048) return void 0;
	const hash = value.indexOf("#");
	const destination = hash < 0 ? value : value.slice(0, hash);
	if (destination.includes("?")) return void 0;
	let path;
	try {
		path = decodeURIComponent(destination);
	} catch {
		return;
	}
	if (path === "" || /[\u0000-\u001f\u007f]/.test(path) || /^[\\/]{2}/.test(path) || /^[a-z][a-z\d+.-]*:/i.test(path) && !/^[a-z]:[\\/]/i.test(path)) return void 0;
	if (hash < 0) return { path };
	const match = /^L([1-9]\d*)(?:-L([1-9]\d*))?$/.exec(value.slice(hash + 1));
	if (match === null) return void 0;
	const line = Number(match[1]);
	const end = match[2] === void 0 ? line : Number(match[2]);
	if (!Number.isSafeInteger(line) || !Number.isSafeInteger(end) || end < line) return void 0;
	return {
		path,
		line
	};
}
/** Classify a link destination while preserving the existing external URL policy. */
function classifyLinkTarget(value) {
	const external = safeHref(value);
	if (external !== void 0) return {
		type: "external",
		href: external
	};
	if (typeof value !== "string") return { type: "invalid" };
	const file = parseFileLink(value.trim());
	return file === void 0 ? { type: "invalid" } : {
		type: "file",
		file
	};
}
//#endregion
//#region src/client/theme.ts
const THEME_RADII = [
	"none",
	"sm",
	"md",
	"lg",
	"xl"
];
const THEME_DENSITIES = [
	"compact",
	"normal",
	"relaxed"
];
const THEME_SURFACES = [
	"default",
	"flat",
	"outline",
	"soft",
	"glass",
	"elevated"
];
const THEME_SHADOWS = [
	"none",
	"soft",
	"strong"
];
/** Style keys a node may carry, mapped to whether a bare number means px. */
const STYLE_KEYS = {
	background: false,
	backgroundColor: false,
	color: false,
	border: false,
	borderColor: false,
	borderWidth: true,
	borderStyle: false,
	borderRadius: true,
	padding: true,
	margin: true,
	gap: true,
	fontSize: true,
	fontWeight: false,
	fontFamily: false,
	fontStyle: false,
	lineHeight: false,
	letterSpacing: true,
	textAlign: false,
	textTransform: false,
	textShadow: false,
	boxShadow: false,
	opacity: false,
	width: true,
	maxWidth: true,
	minHeight: true,
	backdropFilter: false,
	filter: false,
	transform: false
};
const UNSAFE = /url\s*\(|image-set|expression|javascript:|[;{}<>\\@]|\/\*/iu;
const MAX_VALUE = 240;
/** A CSS value the model may set, or undefined when it is unsafe or malformed. */
function safeCssValue(value, pxNumbers = false) {
	if (typeof value === "number") {
		if (!Number.isFinite(value)) return void 0;
		return pxNumbers ? `${value}px` : String(value);
	}
	if (typeof value !== "string") return void 0;
	const trimmed = value.trim();
	if (trimmed === "" || trimmed.length > MAX_VALUE || UNSAFE.test(trimmed)) return void 0;
	let depth = 0;
	for (const ch of trimmed) if (ch === "(") depth++;
	else if (ch === ")" && --depth < 0) return void 0;
	return depth === 0 ? trimmed : void 0;
}
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const oneOf = (value, list) => typeof value === "string" && list.includes(value) ? value : void 0;
/** Repair a node's `style`; unknown keys and unsafe values are dropped. */
function repairNodeStyle(value) {
	if (!isRecord(value)) return void 0;
	const out = {};
	for (const [key, raw] of Object.entries(value)) {
		if (!Object.hasOwn(STYLE_KEYS, key)) continue;
		const safe = safeCssValue(raw, STYLE_KEYS[key]);
		if (safe !== void 0) out[key] = typeof raw === "number" && !STYLE_KEYS[key] ? raw : safe;
	}
	return Object.keys(out).length === 0 ? void 0 : out;
}
/** Repair a root `theme`; malformed fields are dropped one by one. */
function repairTheme(value) {
	if (!isRecord(value)) return void 0;
	const out = {};
	for (const key of [
		"accent",
		"background",
		"text",
		"muted",
		"border"
	]) {
		const safe = safeCssValue(value[key]);
		if (safe !== void 0) out[key] = safe;
	}
	const radius = typeof value.radius === "number" && Number.isFinite(value.radius) ? Math.max(0, Math.min(40, value.radius)) : oneOf(value.radius, THEME_RADII);
	if (radius !== void 0) out.radius = radius;
	const density = oneOf(value.density, THEME_DENSITIES);
	if (density !== void 0) out.density = density;
	const surface = oneOf(value.surface, THEME_SURFACES);
	if (surface !== void 0) out.surface = surface;
	const shadow = oneOf(value.shadow, THEME_SHADOWS);
	if (shadow !== void 0) out.shadow = shadow;
	const font = safeCssValue(value.font);
	if (font !== void 0 && font.length <= 160) out.font = font;
	if (Array.isArray(value.palette)) {
		const palette = value.palette.map((entry) => safeCssValue(entry)).filter((entry) => entry !== void 0).slice(0, 16);
		if (palette.length > 0) out.palette = palette;
	}
	return Object.keys(out).length === 0 ? void 0 : out;
}
//#endregion
//#region src/client/safe-math.ts
const SAFE_MATH_LIMITS = {
	maxExpressionLength: 512,
	maxDepth: 32
};
/** 解析十进制输入，拒绝 JavaScript Number 接受的非十进制进制写法。 */
function parseDecimalNumber(value) {
	const normalized = value.trim();
	if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) return void 0;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : void 0;
}
const CONSTANTS = {
	pi: Math.PI,
	e: Math.E,
	tau: Math.PI * 2
};
const FUNCTIONS = {
	sin: Math.sin,
	cos: Math.cos,
	tan: Math.tan,
	asin: Math.asin,
	acos: Math.acos,
	atan: Math.atan,
	sqrt: Math.sqrt,
	cbrt: Math.cbrt,
	exp: Math.exp,
	log: Math.log10,
	ln: Math.log,
	abs: Math.abs,
	floor: Math.floor,
	ceil: Math.ceil,
	round: Math.round,
	min: Math.min,
	max: Math.max,
	pow: (a, b) => Math.pow(a, b)
};
var ParseError = class extends Error {
	pos;
	constructor(message, pos) {
		super(`SafeMath parse error at ${pos}: ${message}`);
		this.pos = pos;
	}
};
var SafeMathParser = class {
	src;
	vars;
	allowImplicitVariables;
	allowUnboundVariables;
	i = 0;
	depth = 0;
	variables = /* @__PURE__ */ new Set();
	constructor(src, vars, allowImplicitVariables, allowUnboundVariables) {
		this.src = src;
		this.vars = vars;
		this.allowImplicitVariables = allowImplicitVariables;
		this.allowUnboundVariables = allowUnboundVariables;
	}
	parse() {
		const node = this.parseExpr();
		this.skipWs();
		if (this.i < this.src.length) throw new ParseError("unexpected trailing input", this.i);
		return {
			evaluate: this.evalNode(node),
			variables: [...this.variables]
		};
	}
	evalNode(node) {
		if (typeof node === "number") return () => node;
		return node;
	}
	parseExpr() {
		let left = this.parseTerm();
		for (;;) {
			this.skipWs();
			const c = this.peek();
			if (c === "+" || c === "-") {
				this.i++;
				const right = this.parseTerm();
				const op = c;
				const prev = left;
				left = op === "+" ? (x) => this.asNum(prev, x) + this.asNum(right, x) : (x) => this.asNum(prev, x) - this.asNum(right, x);
			} else return left;
		}
	}
	parseTerm() {
		let left = this.parseUnary();
		for (;;) {
			this.skipWs();
			const c = this.peek();
			if (c === "*" || c === "/" || c === "%") {
				this.i++;
				const right = this.parseUnary();
				const op = c;
				const prev = left;
				left = op === "*" ? (x) => this.asNum(prev, x) * this.asNum(right, x) : op === "/" ? (x) => this.asNum(prev, x) / this.asNum(right, x) : (x) => this.asNum(prev, x) % this.asNum(right, x);
			} else return left;
		}
	}
	parseUnary() {
		this.skipWs();
		const c = this.char();
		if (c === "-" || c === "+") {
			this.i++;
			const operand = this.withDepth(() => this.parseUnary());
			return c === "-" ? (x) => -this.asNum(operand, x) : (x) => this.asNum(operand, x);
		}
		return this.parsePower();
	}
	parsePower() {
		const base = this.parseAtom();
		this.skipWs();
		if (this.peek() === "^") {
			this.i++;
			const exp = this.withDepth(() => this.parsePower());
			const prev = base;
			return (x) => Math.pow(this.asNum(prev, x), this.asNum(exp, x));
		}
		return base;
	}
	parseAtom() {
		this.skipWs();
		const c = this.char();
		if (c === "(") {
			this.i++;
			const inner = this.withDepth(() => this.parseExpr());
			this.skipWs();
			if (this.peek() !== ")") throw new ParseError("expected )", this.i);
			this.i++;
			return inner;
		}
		if (c >= "0" && c <= "9" || c === ".") return this.parseNumber();
		if (this.isIdentStart(c)) return this.parseIdent();
		throw new ParseError(`unexpected character '${c}'`, this.i);
	}
	parseNumber() {
		const start = this.i;
		let sawDigit = false;
		while (this.i < this.src.length && /[0-9]/.test(this.src[this.i])) {
			sawDigit = true;
			this.i++;
		}
		if (this.peek() === ".") {
			this.i++;
			while (this.i < this.src.length && /[0-9]/.test(this.src[this.i])) {
				sawDigit = true;
				this.i++;
			}
		}
		if (!sawDigit) throw new ParseError(`invalid number '${this.src.slice(start, this.i)}'`, start);
		if (this.peek() === "e" || this.peek() === "E") {
			this.i++;
			if (this.peek() === "+" || this.peek() === "-") this.i++;
			const exponentStart = this.i;
			while (this.i < this.src.length && /[0-9]/.test(this.src[this.i])) this.i++;
			if (this.i === exponentStart) throw new ParseError(`invalid number '${this.src.slice(start, this.i)}'`, start);
		}
		const text = this.src.slice(start, this.i);
		const value = Number(text);
		if (!Number.isFinite(value)) throw new ParseError(`invalid number '${text}'`, start);
		return value;
	}
	parseIdent() {
		const start = this.i;
		while (this.i < this.src.length && this.isIdentChar(this.src[this.i])) this.i++;
		const name = this.src.slice(start, this.i);
		this.skipWs();
		if (this.peek() === "(") {
			if (!Object.hasOwn(FUNCTIONS, name)) throw new ParseError(`unknown function '${name}'`, start);
			const fn = FUNCTIONS[name];
			this.i++;
			const args = [];
			this.skipWs();
			if (this.peek() === ")") this.i++;
			else for (;;) {
				args.push(this.withDepth(() => this.parseExpr()));
				this.skipWs();
				const sep = this.peek();
				if (sep === ",") {
					this.i++;
					continue;
				}
				if (sep === ")") {
					this.i++;
					break;
				}
				throw new ParseError("expected , or ) in call", this.i);
			}
			return (x) => fn(...args.map((a) => this.asNum(a, x)));
		}
		if (!this.allowImplicitVariables && Object.hasOwn(this.vars, name)) {
			this.variables.add(name);
			const captured = this.vars[name];
			return () => captured;
		}
		if (Object.hasOwn(CONSTANTS, name) && this.allowImplicitVariables) return CONSTANTS[name];
		if (this.allowImplicitVariables && name === "x") return (value) => value;
		if (Object.hasOwn(this.vars, name)) {
			this.variables.add(name);
			const captured = this.vars[name];
			return () => captured;
		}
		if (Object.hasOwn(CONSTANTS, name)) return CONSTANTS[name];
		if (this.allowImplicitVariables && /^[a-z]$/.test(name)) return () => 1;
		if (this.allowUnboundVariables) {
			this.variables.add(name);
			return () => NaN;
		}
		throw new ParseError(`unknown identifier '${name}'`, start);
	}
	asNum(node, x) {
		return typeof node === "number" ? node : node(x);
	}
	/** 在递归解析前限制表达式层数。 */
	withDepth(read) {
		this.depth += 1;
		if (this.depth > SAFE_MATH_LIMITS.maxDepth) {
			this.depth -= 1;
			throw new ParseError("expression nesting exceeds limit", this.i);
		}
		try {
			return read();
		} finally {
			this.depth -= 1;
		}
	}
	skipWs() {
		while (this.i < this.src.length && /\s/.test(this.src[this.i])) this.i++;
	}
	peek() {
		return this.src[this.i];
	}
	char() {
		const c = this.peek();
		if (c === void 0) throw new ParseError("unexpected end of input", this.i);
		return c;
	}
	isIdentStart(c) {
		return c !== void 0 && /[a-zA-Z_]/.test(c);
	}
	isIdentChar(c) {
		return /[a-zA-Z0-9_]/.test(c);
	}
};
/**
* 编译安全数学表达式，并返回表达式引用的字段名称。
*
* @param expr - 受限算术表达式。
* @param options - 字段值和变量解析规则。
* @returns 编译后的程序；表达式无效时返回 null。
*/
function compileMathExprProgram(expr, options = {}) {
	try {
		const vars = { ...options.vars };
		if (options.allowImplicitVariables !== false) delete vars.x;
		if (expr.length > SAFE_MATH_LIMITS.maxExpressionLength || Object.values(vars).some((value) => !Number.isFinite(value))) return null;
		return new SafeMathParser(expr, vars, options.allowImplicitVariables !== false, options.allowUnboundVariables === true).parse();
	} catch {
		return null;
	}
}
//#endregion
//#region src/client/computed.ts
const COMPUTED_ID = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
const COMPUTED_REFERENCE_PATTERN = /\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g;
const COMPUTED_TEMPLATE_FIELDS = {
	text: /* @__PURE__ */ new Set(["content"]),
	button: /* @__PURE__ */ new Set(["label"]),
	input: /* @__PURE__ */ new Set(["label", "placeholder"]),
	select: /* @__PURE__ */ new Set(["label"]),
	checkbox: /* @__PURE__ */ new Set(["label"]),
	link: /* @__PURE__ */ new Set(["label"]),
	image: /* @__PURE__ */ new Set(["alt", "caption"]),
	audio: /* @__PURE__ */ new Set(["alt"]),
	video: /* @__PURE__ */ new Set(["alt"]),
	svg: /* @__PURE__ */ new Set(["title"]),
	badge: /* @__PURE__ */ new Set(["label"]),
	hero: /* @__PURE__ */ new Set([
		"title",
		"subtitle",
		"value",
		"label",
		"delta"
	]),
	stat: /* @__PURE__ */ new Set([
		"label",
		"value",
		"delta"
	]),
	progress: /* @__PURE__ */ new Set(["label", "valueLabel"]),
	divider: /* @__PURE__ */ new Set(["label"]),
	arrow: /* @__PURE__ */ new Set(["label"]),
	icon: /* @__PURE__ */ new Set(["label"]),
	avatar: /* @__PURE__ */ new Set(["name"]),
	copy: /* @__PURE__ */ new Set(["label"]),
	breadcrumb: /* @__PURE__ */ new Set(["items"]),
	radio: /* @__PURE__ */ new Set(["label", "explanation"]),
	card: /* @__PURE__ */ new Set(["title", "eyebrow"]),
	list: /* @__PURE__ */ new Set(["items"]),
	table: /* @__PURE__ */ new Set(["columns"]),
	blocks: /* @__PURE__ */ new Set(["title", "caption"]),
	accordion: /* @__PURE__ */ new Set(["items"]),
	tabs: /* @__PURE__ */ new Set(["tabs"]),
	plot: /* @__PURE__ */ new Set(["title"]),
	diagram: /* @__PURE__ */ new Set(["title"]),
	scene3d: /* @__PURE__ */ new Set(["title"]),
	echart: /* @__PURE__ */ new Set(["title"]),
	callout: /* @__PURE__ */ new Set(["title", "content"]),
	steps: /* @__PURE__ */ new Set(["steps"]),
	keyvalue: /* @__PURE__ */ new Set(["pairs"]),
	quiz: /* @__PURE__ */ new Set(["question", "explanation"]),
	submit: /* @__PURE__ */ new Set(["label"]),
	switch: /* @__PURE__ */ new Set(["label"]),
	slider: /* @__PURE__ */ new Set(["label"]),
	textarea: /* @__PURE__ */ new Set(["label", "placeholder"]),
	timeline: /* @__PURE__ */ new Set(["items"])
};
/** 判断规格字段是否用于展示可插值的文字。 */
function isComputedTemplateField(type, key) {
	return typeof type === "string" && (COMPUTED_TEMPLATE_FIELDS[type]?.has(key) ?? false);
}
/** 只有组件容器的子节点字段允许再次识别组件；原始数据中的 type 没有组件含义。 */
function getComputedChildNodeScope(type, key, parentScope) {
	if (parentScope === "nested-items") return key === "items";
	if (parentScope !== true) return false;
	if (type === "tabs") return key === "tabs" ? "nested-items" : false;
	if (type === "accordion") return key === "items" ? "nested-items" : false;
	if (type === "table") return key === "details";
	return key === "items" && [
		"row",
		"col",
		"grid",
		"card",
		"carousel",
		"list"
	].includes(String(type));
}
/** 为嵌套展示数据选择模板范围，并在组件边界重置继承范围。 */
function getComputedTemplateScope(type, key, parentScope) {
	if (typeof type === "string") {
		if (type === "blocks" && key === "rows") return "blocks-row";
		return isComputedTemplateField(type, key);
	}
	if (parentScope === "blocks-row") {
		if (key === "cells") return "blocks-cell";
		return key === "label";
	}
	if (parentScope === "blocks-cell") return key === "text" || key === "sub";
	return parentScope;
}
/**
* 收集可供 Computed 表达式读取的非密码字段 ID。
*
* @param spec - 已修复的 GenUI 规格。
* @returns 符合表达式名称规则的字段 ID 集合。
*/
function getComputedInputIds(spec) {
	const ids = /* @__PURE__ */ new Set();
	walkGenuiNodes(spec, (node) => {
		if (node.type !== "input" && node.type !== "select" && node.type !== "slider" && node.type !== "textarea") return;
		if (node.type === "input" && node.inputType === "password") return;
		if (node.id !== void 0 && COMPUTED_ID.test(node.id)) ids.add(node.id);
	});
	return ids;
}
/** 收集重复声明的数值输入字段 ID。 */
function getDuplicateComputedInputIds(spec) {
	const counts = /* @__PURE__ */ new Map();
	walkGenuiNodes(spec, (node) => {
		if (node.type !== "input" && node.type !== "select" && node.type !== "slider" && node.type !== "textarea") return;
		if (node.type === "input" && node.inputType === "password") return;
		if (node.id !== void 0 && COMPUTED_ID.test(node.id)) counts.set(node.id, (counts.get(node.id) ?? 0) + 1);
	});
	return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
}
/**
* 检查计算定义并按字段依赖关系生成执行顺序。
*
* @param definitions - 规格声明的计算字段。
* @param inputIds - 可读取的输入字段 ID。
* @param duplicateInputIds - 重复声明的输入字段 ID。
* @returns 有序计算定义及对应错误。
*/
function buildComputedGraph(definitions, inputIds, duplicateInputIds = /* @__PURE__ */ new Set(), allowExternalReferences = false) {
	const errors = Object.create(null);
	const formulas = /* @__PURE__ */ new Map();
	if (definitions.length > GENUI_LIMITS.maxComputedFields) {
		const firstExcess = definitions[GENUI_LIMITS.maxComputedFields];
		errors[firstExcess.id] = `计算字段数量超过 ${GENUI_LIMITS.maxComputedFields} 个`;
	}
	const declaredFormulaIds = /* @__PURE__ */ new Set();
	for (const definition of definitions.slice(0, GENUI_LIMITS.maxComputedFields)) {
		if (!COMPUTED_ID.test(definition.id)) {
			errors[definition.id] = "计算字段 ID 格式无效";
			continue;
		}
		declaredFormulaIds.add(definition.id);
		if (inputIds.has(definition.id) || formulas.has(definition.id)) {
			errors[definition.id] = "计算字段 ID 重复";
			continue;
		}
		formulas.set(definition.id, definition);
	}
	const symbols = Object.fromEntries([...inputIds, ...formulas.keys()].map((id) => [id, 0]));
	const programs = /* @__PURE__ */ new Map();
	for (const [id, definition] of formulas) {
		const program = compileMathExprProgram(definition.expr, {
			vars: symbols,
			allowImplicitVariables: false,
			allowUnboundVariables: allowExternalReferences
		});
		if (program === null) {
			errors[id] = "表达式无效或引用了未声明字段";
			continue;
		}
		const duplicateInput = program.variables.find((name) => duplicateInputIds.has(name));
		if (duplicateInput !== void 0) errors[id] = `输入字段 ${duplicateInput} ID 重复，无法计算`;
		programs.set(id, program.variables.filter((name) => declaredFormulaIds.has(name)));
	}
	const order = [];
	const state = /* @__PURE__ */ new Map();
	const path = [];
	const visit = (id) => {
		if (state.get(id) === "visited" || errors[id] !== void 0) return;
		if (state.get(id) === "visiting") {
			const start = path.indexOf(id);
			for (const cycleId of path.slice(start)) errors[cycleId] = "存在循环依赖";
			return;
		}
		state.set(id, "visiting");
		path.push(id);
		for (const dependency of programs.get(id) ?? []) {
			visit(dependency);
			if (errors[dependency] !== void 0 && errors[id] === void 0) errors[id] = `依赖字段 ${dependency} 无效`;
		}
		path.pop();
		state.set(id, "visited");
		const definition = formulas.get(id);
		if (definition !== void 0 && errors[id] === void 0) order.push(definition);
	};
	for (const id of formulas.keys()) visit(id);
	return {
		order,
		errors
	};
}
/** 收集表单规格中的初始值，供首次渲染的计算读取。 */
function collectInputDefaults(spec) {
	const defaults = Object.create(null);
	walkGenuiNodes(spec, (node) => {
		if (node.type !== "input" && node.type !== "textarea" && node.type !== "slider" && node.type !== "select") return;
		if (node.id === void 0) return;
		if (node.type === "input" && node.inputType !== "password" && node.value !== void 0) defaults[node.id] = node.value;
		if (node.type === "textarea" && node.value !== void 0) defaults[node.id] = node.value;
		if (node.type === "slider") defaults[node.id] = String(node.value ?? node.min ?? 0);
		if (node.type === "select" && node.selected !== void 0) defaults[node.id] = node.options[node.selected] ?? "";
	});
	return defaults;
}
/** 按字段指定的 Intl.NumberFormat 选项生成显示文本。 */
function formatComputedValue(value, format) {
	if (format === void 0) return String(value);
	const options = {
		style: format.style ?? "decimal",
		...format.currency === void 0 ? {} : { currency: format.currency },
		...format.minimumFractionDigits === void 0 ? {} : { minimumFractionDigits: format.minimumFractionDigits },
		...format.maximumFractionDigits === void 0 ? {} : { maximumFractionDigits: format.maximumFractionDigits }
	};
	return new Intl.NumberFormat(format.locale, options).format(value);
}
/**
* 读取输入字段并计算所有可用的 Computed 值。
*
* @param spec - 已修复的 GenUI 规格。
* @param fields - 当前交互状态中的字段值。
* @returns 数值结果、格式化结果和计算错误。
*/
function evaluateComputed(spec, fields) {
	const inputIds = getComputedInputIds(spec);
	const definitions = spec.computed ?? [];
	const graph = buildComputedGraph(definitions, inputIds, new Set(getDuplicateComputedInputIds(spec)));
	const errors = Object.assign(Object.create(null), graph.errors);
	const computedIds = definitions.slice(0, GENUI_LIMITS.maxComputedFields).map((item) => item.id);
	const fieldValues = {
		...collectInputDefaults(spec),
		...fields
	};
	const numericValues = Object.create(null);
	const formatted = Object.create(null);
	for (const definition of graph.order) {
		const programVariables = Object.create(null);
		const programReferences = compileMathExprProgram(definition.expr, {
			vars: Object.fromEntries([...inputIds, ...computedIds].map((id) => [id, 0])),
			allowImplicitVariables: false
		});
		if (programReferences === null) {
			errors[definition.id] = "表达式无效或引用了未声明字段";
			continue;
		}
		let invalidInput;
		for (const name of programReferences.variables) {
			if (Object.hasOwn(numericValues, name)) {
				programVariables[name] = numericValues[name];
				continue;
			}
			if (!inputIds.has(name)) {
				invalidInput = name;
				break;
			}
			const raw = Object.hasOwn(fieldValues, name) ? fieldValues[name] : void 0;
			const value = raw === void 0 ? void 0 : parseDecimalNumber(raw);
			if (value === void 0) {
				invalidInput = name;
				break;
			}
			numericValues[name] = value;
			programVariables[name] = value;
		}
		if (invalidInput !== void 0) {
			errors[definition.id] = `字段 ${invalidInput} 需要有效数值`;
			continue;
		}
		const program = compileMathExprProgram(definition.expr, {
			vars: programVariables,
			allowImplicitVariables: false
		});
		if (program === null) {
			errors[definition.id] = "表达式无效或引用了未声明字段";
			continue;
		}
		const value = program.evaluate(0);
		if (!Number.isFinite(value)) {
			errors[definition.id] = "计算结果超出有效数值范围";
			continue;
		}
		numericValues[definition.id] = value;
		formatted[definition.id] = formatComputedValue(value, definition.format);
	}
	return {
		values: Object.fromEntries(Object.entries(numericValues).filter(([id]) => !inputIds.has(id))),
		formatted,
		errors
	};
}
/** 递归解析模板文字与数值对象引用。 */
function resolveComputedValue(value, key, result, referenceAllowed = false, chartReference = false, tableCellReference = false, templateAllowed = false, nodeScope = false) {
	if (typeof value === "string") {
		if (!templateAllowed || key === "id" || key === "type" || key === "expr" || key === "action" || key === "href" || key === "src" || key === "poster") return value;
		return value.replace(COMPUTED_REFERENCE_PATTERN, (_match, id) => result.formatted[id] ?? "无效输入");
	}
	if (nodeScope === false && !referenceAllowed && !templateAllowed) return value;
	if (Array.isArray(value)) return value.map((item) => resolveComputedValue(item, void 0, result, referenceAllowed, chartReference, tableCellReference, templateAllowed, nodeScope));
	if (value === null || typeof value !== "object") return value;
	const record = value;
	const nodeType = nodeScope === true ? record.type : void 0;
	if (referenceAllowed && Object.keys(record).length === 1 && typeof record.$computed === "string") {
		if (!Object.hasOwn(result.values, record.$computed)) return chartReference ? null : "无效输入";
		const computedValue = result.values[record.$computed];
		if (tableCellReference) return {
			[GENUI_COMPUTED_CELL]: true,
			value: computedValue,
			formatted: result.formatted[record.$computed] ?? String(computedValue)
		};
		return chartReference && Math.abs(computedValue) > 0xe8d4a51000 ? null : computedValue;
	}
	const resolved = Object.fromEntries(Object.entries(record).map(([entryKey, entryValue]) => [entryKey, resolveComputedValue(entryValue, entryKey, result, nodeType === "table" && entryKey === "rows" || (nodeType === "chart" || nodeType === "echart") && (entryKey === "data" || entryKey === "series") || nodeType === "echart" && entryKey === "option" || referenceAllowed, (nodeType === "chart" || nodeType === "echart") && (entryKey === "data" || entryKey === "series" || entryKey === "option") || chartReference, nodeType === "table" && entryKey === "rows" || tableCellReference, getComputedTemplateScope(nodeType, entryKey, templateAllowed), getComputedChildNodeScope(nodeType, entryKey, nodeScope))]));
	if (nodeType === "checkbox" && typeof record.label === "string") Object.assign(resolved, { [GENUI_CHECKBOX_VALUE]: record.label });
	if (nodeType === "chart" && Array.isArray(resolved.data)) resolved.data = resolved.data.filter((point) => point !== null && typeof point === "object" && point.value !== null);
	return resolved;
}
/**
* 将模板引用和数值引用解析到待渲染组件树中。
*
* @param spec - 原始已修复规格。
* @param result - 当前字段状态对应的计算结果。
* @returns 已替换引用的规格副本。
*/
function resolveComputedSpec(spec, result) {
	const items = resolveComputedValue(spec.items, void 0, result, false, false, false, false, true);
	const title = spec.title === void 0 ? void 0 : resolveComputedValue(spec.title, void 0, result, false, false, false, true);
	return {
		...spec,
		...title === void 0 ? {} : { title },
		items
	};
}
//#endregion
//#region src/client/guard.ts
function fieldKindMatches(value, kind) {
	switch (kind) {
		case "string": return typeof value === "string";
		case "string-or-null": return value === null || typeof value === "string";
		case "number": return typeof value === "number" && Number.isFinite(value);
		case "boolean": return typeof value === "boolean";
		case "nodes": return Array.isArray(value);
		case "array": return Array.isArray(value);
		case "object": return obj(value) !== void 0;
		case "unknown": return true;
	}
}
function fieldKindLabel(kind) {
	switch (kind) {
		case "string-or-null": return "a string or null";
		case "number": return "a finite number";
		case "boolean": return "a boolean";
		case "nodes":
		case "array": return "an array";
		case "object": return "an object";
		case "unknown": return "a value";
		default: return "a string";
	}
}
/** Detect an existing field diagnostic using both canonical and legacy messages. */
function hasFieldError(errors, at, field) {
	return errors.some((error) => error.startsWith(`${at}.${field} `) || error.includes(`'${field}'`) || error.includes(`requires ${field}`));
}
/** Validate present fields against the runtime schema without duplicating errors. */
function validateSchemaFieldKinds(value, at, definition, errors, excludedFields = []) {
	for (const [field, kind] of Object.entries(definition.fields)) {
		if (excludedFields.includes(field) || value[field] === void 0) continue;
		if (!fieldKindMatches(value[field], kind) && !hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be ${fieldKindLabel(kind)}`);
	}
	for (const [field, values] of Object.entries(definition.enums)) {
		if (excludedFields.includes(field) || value[field] === void 0 || !fieldKindMatches(value[field], "string")) continue;
		if (!values.includes(value[field]) && !hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be one of ${values.join(", ")}`);
	}
}
/** Validate one schema-declared nested record and all records below it. */
function validateRecordSchema(value, at, definition, errors) {
	const holder = obj(value);
	if (holder === void 0) {
		errors.push(`${at} must be an object`);
		return;
	}
	for (const field of definition.required) {
		const kind = definition.fields[field];
		if (holder[field] === void 0) {
			if (!hasFieldError(errors, at, field)) errors.push(`${at}: requires ${field}${kind === void 0 ? "" : ` (${fieldKindLabel(kind)})`}`);
		} else if (kind !== void 0 && !fieldKindMatches(holder[field], kind)) {
			if (!hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be ${fieldKindLabel(kind)}`);
		}
	}
	for (const [field, kind] of Object.entries(definition.fields)) if (holder[field] !== void 0 && !fieldKindMatches(holder[field], kind)) {
		if (!hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be ${fieldKindLabel(kind)}`);
	}
	for (const [field, values] of Object.entries(definition.enums)) if (holder[field] !== void 0 && typeof holder[field] === "string" && !values.includes(holder[field])) {
		if (!hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be one of ${values.join(", ")}`);
	}
	for (const [field, nested] of Object.entries(definition.nested)) {
		const nestedValue = holder[field];
		if (nestedValue === void 0) continue;
		if (Array.isArray(nestedValue)) nestedValue.forEach((item, index) => validateRecordSchema(item, `${at}.${field}[${index}]`, nested, errors));
		else validateRecordSchema(nestedValue, `${at}.${field}`, nested, errors);
	}
}
/** Validate registry-declared nested records before repair can discard them. */
function validateNestedRecordSchemas(value, at, definition, errors) {
	for (const [field, nested] of Object.entries(definition.nested)) {
		const nestedValue = value[field];
		if (nestedValue === void 0) continue;
		if (Array.isArray(nestedValue)) (value.type === "image-group" && field === "items" ? nestedValue.slice(0, GENUI_LIMITS.maxImageGroupItems) : value.type === "entity-card" && field === "metadata" ? nestedValue.slice(0, GENUI_LIMITS.maxEntityMetadata) : value.type === "entity-card" && field === "actions" ? nestedValue.slice(0, GENUI_LIMITS.maxEntityActions) : value.type === "map" && field === "locations" ? nestedValue.slice(0, GENUI_LIMITS.maxMapLocations) : value.type === "map" && field === "routes" ? nestedValue.slice(0, GENUI_LIMITS.maxMapRoutes) : field === "computed" ? nestedValue.slice(0, GENUI_LIMITS.maxComputedFields) : nestedValue).forEach((item, index) => validateRecordSchema(item, `${at}.${field}[${index}]`, nested, errors));
		else validateRecordSchema(nestedValue, `${at}.${field}`, nested, errors);
	}
}
/**
* Does this table state its columns implicitly, in a 2D `rows`/`data` body?
* Repair turns the leading row into the header (see `deriveTableColumns`), so
* validation must not report the missing `columns` that repair is about to
* supply — while still reporting it for bodies repair cannot read (a scalar
* `rows`, an empty array, a 1D list).
*/
function hasDerivableTableColumns(value) {
	const rows = value.rows !== void 0 ? value.rows : value.data;
	if (!Array.isArray(rows) || rows.length === 0) return false;
	return Array.isArray(rows[0]);
}
/** Validate the registry-declared presence and primitive shape of a native node. */
function validateRegistryFields(value, at, definition, errors) {
	const type = String(value.type);
	const alreadyReported = (field) => hasFieldError(errors, at, field);
	const derivableField = type === "table" && hasDerivableTableColumns(value) ? "columns" : null;
	for (const field of definition.required) {
		const kind = definition.fields[field];
		if (kind === void 0 || value[field] === void 0) {
			if (field !== derivableField && !alreadyReported(field)) errors.push(`${at}: type '${type}' requires ${field}${kind === void 0 ? "" : ` (${fieldKindLabel(kind)})`}`);
			continue;
		}
		if (!fieldKindMatches(value[field], kind) && !alreadyReported(field)) errors.push(`${at}.${field} must be ${fieldKindLabel(kind)}`);
	}
	validateSchemaFieldKinds(value, at, definition, errors, ["type"]);
	for (const group of definition.oneOfRequired) if (!group.some((field) => value[field] !== void 0) && !errors.some((error) => error.includes(`requires ${group.join(" or ")}`))) errors.push(`${at}: type '${type}' requires one of ${group.join(" or ")}`);
	for (const rule of definition.conditionalRequired) {
		if (value[rule.when.field] !== rule.when.equals) continue;
		for (const field of rule.required) if (value[field] === void 0 && !alreadyReported(field)) errors.push(`${at}: type '${type}' requires ${field}${rule.message === void 0 ? "" : ` (${rule.message})`}`);
	}
	validateNestedRecordSchemas(value, at, definition, errors);
}
/** Walk `list` with the shared node budget; drops invalid entries. */
function repairItems(list, ctx, depth) {
	if (!Array.isArray(list)) return [];
	const out = [];
	for (const item of list) {
		if (ctx.remaining <= 0) break;
		ctx.remaining -= 1;
		const node = repairNode(item, ctx, depth);
		if (node !== null) out.push(node);
	}
	return out;
}
/** Optional explicit palette: up to 12 validated colour values. */
function paletteValues(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v.slice(0, 12)) {
		const value = color(item);
		if (value === void 0) continue;
		out.push(value);
	}
	return out.length > 0 ? out : void 0;
}
/** Optional `stat.spark` series: finite numbers only, 2..60 points. */
function sparkValues(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v.slice(0, 60)) {
		const n = typeof item === "number" ? item : Number(item);
		if (!Number.isFinite(n)) return void 0;
		out.push(n);
	}
	return out.length >= 2 ? out : void 0;
}
/** Layout hints are component-agnostic: `span` and `when` survive repair on ANY
*  node (the renderer applies them inside a layout / before paint). Kept out of
*  the per-case switches so a new component type cannot forget them. */
function repairNode(value, ctx, depth) {
	const node = repairNodeFields(value, ctx, depth);
	if (node === null) return null;
	const raw = obj(value);
	const span = int(raw?.span, 2, 12);
	const when = repairWhen(raw?.when);
	const enableWhen = repairWhen(raw?.enableWhen);
	const disabledReason = str(raw?.disabledReason, 200);
	const style = node.type === "map" ? void 0 : repairNodeStyle(raw?.style);
	const extras = {
		...span === void 0 ? {} : { span },
		...style === void 0 ? {} : { style },
		...when === void 0 ? {} : { when },
		...enableWhen === void 0 ? {} : { enableWhen },
		...disabledReason === void 0 ? {} : { disabledReason }
	};
	return Object.keys(extras).length === 0 ? node : {
		...node,
		...extras
	};
}
/** Repair a `when` clause; a malformed one is dropped (node stays visible). */
function repairWhen(value) {
	const v = obj(value);
	if (v === void 0) return void 0;
	const field = str(v.field, 80);
	const op = enu(v.op, WHEN_OPS);
	if (field === void 0 || op === void 0) return void 0;
	const raw = v.value;
	const value_ = Array.isArray(raw) ? raw.length > 0 && raw.length <= 12 ? raw.filter((entry) => typeof entry === "string" || typeof entry === "number").map((entry) => typeof entry === "number" ? entry : str(entry, 120) ?? "").filter((entry) => entry !== "") : void 0 : typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean" ? raw : void 0;
	const value2 = Array.isArray(value_) && value_.length === 0 ? void 0 : value_;
	return {
		field,
		op,
		...value2 === void 0 ? {} : { value: value2 }
	};
}
function repairNodeFields(value, ctx, depth) {
	if (depth > GENUI_LIMITS.maxDepth) return null;
	const v = obj(value);
	if (v === void 0) return null;
	const type = v.type;
	if (typeof type !== "string") return null;
	switch (type) {
		case "text": {
			const content = str(v.content, GENUI_LIMITS.maxString) ?? str(v.text, GENUI_LIMITS.maxString);
			if (content === void 0) return null;
			return {
				type: "text",
				content,
				...opt("size", enu(v.size, TEXT_SIZES)),
				...opt("align", enu(v.align, TEXT_ALIGNS)),
				...opt("tone", enu(v.tone, TEXT_TONES)),
				...opt("mono", v.mono === true ? true : void 0),
				...opt("center", v.center === true ? true : void 0)
			};
		}
		case "icon": {
			const name = str(v.name, 64);
			if (name === void 0) return null;
			return {
				type: "icon",
				name,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("tone", enu(v.tone, ICON_TONES)),
				...opt("size", int(v.size, 8, 96)),
				...opt("tile", v.tile === true ? true : void 0)
			};
		}
		case "blocks": {
			if (!Array.isArray(v.rows)) return null;
			const rows = v.rows.slice(0, GENUI_LIMITS.maxBlocksRows).flatMap((entry) => {
				const row = obj(entry);
				if (row === void 0 || !Array.isArray(row.cells)) return [];
				return [{
					cells: row.cells.slice(0, GENUI_LIMITS.maxBlocksCells).map((cell) => {
						if (cell === null) return null;
						if (typeof cell === "string") return str(cell, GENUI_LIMITS.maxString) ?? "";
						const holder = obj(cell);
						if (holder === void 0) return null;
						const text = str(holder.text, GENUI_LIMITS.maxString);
						if (text === void 0) return null;
						return {
							text,
							...opt("color", color(holder.color)),
							...opt("tone", enu(holder.tone, BLOCK_CELL_TONES)),
							...opt("sub", str(holder.sub, 128))
						};
					}),
					...opt("label", str(row.label, 128)),
					...opt("color", color(row.color)),
					...opt("variant", enu(row.variant, BLOCKS_VARIANTS))
				}];
			});
			if (rows.length === 0) return null;
			return {
				type: "blocks",
				rows,
				...opt("columns", int(v.columns, 1, GENUI_LIMITS.maxBlocksCells)),
				...opt("title", str(v.title, GENUI_LIMITS.maxString)),
				...opt("caption", str(v.caption, GENUI_LIMITS.maxString))
			};
		}
		case "arrow": return {
			type: "arrow",
			...opt("dir", enu(v.dir, ARROW_DIRS)),
			...opt("length", int(v.length, 16, 96)),
			...opt("label", str(v.label, 200))
		};
		case "row": return {
			type: "row",
			items: repairItems(v.items, ctx, depth + 1),
			...opt("wrap", v.wrap === true ? true : void 0),
			...opt("spacer", v.spacer === true ? true : void 0),
			...opt("justify", enu(v.justify, ROW_JUSTIFY))
		};
		case "carousel": return {
			type: "carousel",
			items: repairItems(Array.isArray(v.items) ? v.items.slice(0, GENUI_LIMITS.maxCarouselItems) : [], ctx, depth + 1),
			...opt("title", str(v.title, GENUI_LIMITS.maxString)),
			...opt("itemWidth", num(v.itemWidth, 80, 640)),
			...opt("gap", num(v.gap, 0, Number.MAX_SAFE_INTEGER / 4))
		};
		case "image-group": return {
			type: "image-group",
			items: (Array.isArray(v.items) ? v.items.slice(0, GENUI_LIMITS.maxImageGroupItems) : []).flatMap((value) => {
				const item = obj(value);
				const src = safeMediaSrc(item?.src);
				if (item === void 0 || src === void 0) return [];
				return [{
					src,
					...opt("alt", str(item.alt, GENUI_LIMITS.maxString)),
					...opt("caption", str(item.caption, GENUI_LIMITS.maxString))
				}];
			}),
			...opt("title", str(v.title, GENUI_LIMITS.maxString))
		};
		case "editor": {
			const id = str(v.id, 200);
			const value = str(v.value, GENUI_LIMITS.maxEditorChars);
			if (id === void 0 || value === void 0) return null;
			return {
				type: "editor",
				id,
				value,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("placeholder", str(v.placeholder, GENUI_LIMITS.maxString)),
				...opt("rows", int(v.rows, 3, 24))
			};
		}
		case "entity-card": {
			const name = str(v.name, GENUI_LIMITS.maxString);
			if (name === void 0) return null;
			const metadata = Array.isArray(v.metadata) ? v.metadata.slice(0, GENUI_LIMITS.maxEntityMetadata).flatMap((entry) => {
				const record = obj(entry);
				const label = str(record?.label, 120);
				const value = str(record?.value, GENUI_LIMITS.maxString);
				return label === void 0 || value === void 0 ? [] : [{
					label,
					value
				}];
			}) : void 0;
			const actions = Array.isArray(v.actions) ? v.actions.slice(0, GENUI_LIMITS.maxEntityActions).flatMap((entry) => {
				const record = obj(entry);
				const label = str(record?.label, 120);
				const action = str(record?.action, 200);
				if (label === void 0 || action === void 0) return [];
				return [{
					label,
					action,
					...opt("tone", enu(record?.tone, BUTTON_TONES))
				}];
			}) : void 0;
			const image = safeMediaSrc(v.image);
			const hrefTarget = classifyLinkTarget(v.href);
			const href = hrefTarget.type === "external" ? hrefTarget.href : hrefTarget.type === "file" ? String(v.href).trim() : void 0;
			return {
				type: "entity-card",
				name,
				...opt("image", image),
				...opt("imageAlt", str(v.imageAlt, GENUI_LIMITS.maxString)),
				...opt("description", str(v.description, GENUI_LIMITS.maxString)),
				...opt("metadata", metadata),
				...opt("href", href),
				...opt("sourceLabel", str(v.sourceLabel, 120)),
				...opt("actions", actions)
			};
		}
		case "popover": {
			const label = str(v.label, 200);
			const content = str(v.content, GENUI_LIMITS.maxString);
			if (label === void 0 || content === void 0) return null;
			return {
				type: "popover",
				label,
				content,
				...opt("trigger", enu(v.trigger, POPOVER_TRIGGERS)),
				...opt("placement", enu(v.placement, POPOVER_PLACEMENTS))
			};
		}
		case "choices": {
			const items = (Array.isArray(v.items) ? v.items.slice(0, 8) : []).flatMap((value) => {
				const item = obj(value);
				const label = str(item?.label, 120);
				if (item === void 0 || label === void 0) return [];
				const disabled = item.disabled === true;
				return [{
					label,
					...opt("hint", str(item.hint, 200)),
					...opt("meta", str(item.meta, 40)),
					...item.recommended === true ? { recommended: true } : {},
					...disabled ? { disabled: true } : {},
					...opt("reason", str(item.reason, 200))
				}];
			});
			if (items.length === 0) return null;
			return {
				type: "choices",
				items,
				...opt("title", str(v.title, GENUI_LIMITS.maxString)),
				...opt("prompt", str(v.prompt, 400)),
				...opt("mode", enu(v.mode, CHOICE_MODES)),
				...opt("submit", str(v.submit, 60)),
				...opt("action", str(v.action, 200)),
				...opt("max", int(v.max, 1, items.length)),
				...opt("group", str(v.group, 60)),
				...opt("explanation", str(v.explanation, GENUI_LIMITS.maxString)),
				...typeof v.answer === "number" || typeof v.answer === "string" ? { answer: v.answer } : {}
			};
		}
		case "compare": {
			const panel = (value) => {
				const item = obj(value);
				const src = safeMediaSrc(item?.src);
				if (item === void 0 || src === void 0) return void 0;
				return {
					src,
					...opt("label", str(item.label, 40)),
					...opt("alt", str(item.alt, GENUI_LIMITS.maxString)),
					...opt("caption", str(item.caption, GENUI_LIMITS.maxString))
				};
			};
			const before = panel(v.before);
			const after = panel(v.after);
			if (before === void 0 || after === void 0) return null;
			return {
				type: "compare",
				before,
				after,
				...opt("title", str(v.title, GENUI_LIMITS.maxString)),
				...opt("mode", enu(v.mode, COMPARE_MODES)),
				...opt("height", int(v.height, 120, 640))
			};
		}
		case "col": return {
			type: "col",
			items: repairItems(v.items, ctx, depth + 1),
			...opt("gap", num(v.gap, 0, 96)),
			...opt("width", num(v.width, 1, 100))
		};
		case "grid": return {
			type: "grid",
			cols: int(v.cols, 1, GENUI_LIMITS.maxGridCols) ?? 1,
			items: repairItems(v.items, ctx, depth + 1)
		};
		case "card": return {
			type: "card",
			items: repairItems(v.items, ctx, depth + 1),
			...opt("eyebrow", str(v.eyebrow, 64)),
			...opt("title", str(v.title, GENUI_LIMITS.maxString)),
			...opt("tone", enu(v.tone, CARD_TONES)),
			...opt("accent", color(v.accent)),
			...opt("flat", v.flat === true ? true : void 0)
		};
		case "button": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "button",
				label,
				...opt("tone", enu(v.tone, BUTTON_TONES)),
				...opt("full", v.full === true ? true : void 0),
				...opt("small", v.small === true ? true : void 0),
				...opt("icon", str(v.icon, 64)),
				...opt("action", str(v.action, 200))
			};
		}
		case "input": return {
			type: "input",
			...opt("label", str(v.label, GENUI_LIMITS.maxString)),
			...opt("placeholder", str(v.placeholder, GENUI_LIMITS.maxString)),
			...opt("value", str(v.value, GENUI_LIMITS.maxString)),
			...opt("inputType", enu(v.inputType, INPUT_TYPES)),
			...opt("action", str(v.action, 200)),
			...opt("id", str(v.id, 200))
		};
		case "date-picker": return {
			type: "date-picker",
			...opt("label", str(v.label, GENUI_LIMITS.maxString)),
			...opt("mode", enu(v.mode, DATE_PICKER_MODES)),
			...opt("value", str(v.value, 21)),
			...opt("min", str(v.min, 10)),
			...opt("max", str(v.max, 10)),
			...opt("id", str(v.id, 200))
		};
		case "segmented-control": {
			const options = repairStrings(v.options, GENUI_LIMITS.maxOptions, GENUI_LIMITS.maxString);
			if (options === void 0) return null;
			return {
				type: "segmented-control",
				options,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("value", str(v.value, GENUI_LIMITS.maxString)),
				...opt("id", str(v.id, 200)),
				...opt("action", str(v.action, 200))
			};
		}
		case "select": {
			const options = repairStrings(v.options, GENUI_LIMITS.maxOptions, GENUI_LIMITS.maxString);
			if (options === void 0) return null;
			return {
				type: "select",
				options,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("action", str(v.action, 200)),
				...opt("selected", int(v.selected, 0, options.length - 1)),
				...opt("id", str(v.id, 200))
			};
		}
		case "checkbox": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "checkbox",
				label,
				...opt("checked", v.checked === true ? true : void 0),
				...opt("action", str(v.action, 200)),
				...opt("group", str(v.group, 200))
			};
		}
		case "link": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			const target = classifyLinkTarget(v.href);
			return {
				type: "link",
				label,
				...opt("href", target.type === "external" ? target.href : target.type === "file" ? String(v.href).trim() : void 0)
			};
		}
		case "image": {
			const src = safeMediaSrc(v.src);
			if (src === void 0) return null;
			return {
				type: "image",
				src,
				...opt("alt", str(v.alt, GENUI_LIMITS.maxString)),
				...opt("caption", str(v.caption, GENUI_LIMITS.maxString))
			};
		}
		case "audio": {
			const src = safeMediaSrc(v.src);
			if (src === void 0) return null;
			return {
				type: "audio",
				src,
				...opt("alt", str(v.alt, GENUI_LIMITS.maxString)),
				...opt("loop", v.loop === true ? true : void 0)
			};
		}
		case "video": {
			const src = safeMediaSrc(v.src);
			if (src === void 0) return null;
			return {
				type: "video",
				src,
				...opt("alt", str(v.alt, GENUI_LIMITS.maxString)),
				...opt("poster", safeMediaSrc(v.poster)),
				...opt("loop", v.loop === true ? true : void 0),
				...opt("muted", v.muted === true ? true : void 0),
				...opt("aspectRatio", enu(v.aspectRatio, MEDIA_ASPECT_RATIOS))
			};
		}
		case "badge": {
			const label = str(v.label, GENUI_LIMITS.maxString) ?? str(v.text, GENUI_LIMITS.maxString) ?? str(v.value, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "badge",
				label,
				...opt("tone", enu(v.tone, BADGE_TONES)),
				...opt("icon", str(v.icon, 64))
			};
		}
		case "hero": {
			const title = str(v.title, GENUI_LIMITS.maxString);
			if (title === void 0) return null;
			return {
				type: "hero",
				title,
				...opt("subtitle", str(v.subtitle, GENUI_LIMITS.maxString)),
				...opt("value", str(v.value, 128)),
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("delta", str(v.delta, 64)),
				...opt("spark", sparkValues(v.spark)),
				...opt("tone", enu(v.tone, HERO_TONES))
			};
		}
		case "stat": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			const value = str(v.value, 128);
			if (label === void 0 || value === void 0) return null;
			return {
				type: "stat",
				label,
				value,
				...opt("delta", str(v.delta, 64)),
				...opt("spark", sparkValues(v.spark)),
				...opt("size", v.size === "hero" ? "hero" : void 0)
			};
		}
		case "progress": {
			const value = num(v.value, 0, 100);
			if (value === void 0) return null;
			return {
				type: "progress",
				value,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("valueLabel", str(v.valueLabel, 64)),
				...opt("variant", enu(v.variant, PROGRESS_VARIANTS)),
				...opt("target", num(v.target, 0, 100))
			};
		}
		case "divider": return {
			type: "divider",
			...opt("label", str(v.label, 64))
		};
		case "spacer": return { type: "spacer" };
		case "avatar": {
			const name = str(v.name, 64);
			if (name === void 0) return null;
			return {
				type: "avatar",
				name,
				...opt("color", color(v.color))
			};
		}
		case "list": {
			const items = repairListItems(v.items, GENUI_LIMITS.maxListItems, ctx, depth + 1);
			if (items === void 0) return null;
			return {
				type: "list",
				items,
				...opt("filter", str(v.filter, 64))
			};
		}
		case "table": {
			const prepared = prepareTableRows(v, (count) => {
				ctx.truncatedTableRows += count;
			});
			if (prepared === null) return null;
			const { columns, rows } = prepared;
			const rawTypes = Array.isArray(v.types) ? v.types : void 0;
			const types = rawTypes === void 0 ? void 0 : columns.map((_c, i) => {
				const raw = rawTypes[i];
				return typeof raw === "string" && TABLE_CELL_TYPES.includes(raw) ? raw : "text";
			});
			const rawDetails = Array.isArray(v.details) ? v.details : void 0;
			const details = rawDetails === void 0 ? void 0 : rows.map((_row, i) => {
				if (!isTableDetailReachable({
					columns,
					rows,
					types
				}, i)) return null;
				const entry = repairItems(rawDetails[i], ctx, depth + 1);
				return entry.length === 0 ? null : entry;
			});
			return {
				type: "table",
				columns,
				rows,
				...opt("types", types),
				...opt("total", v.total === true ? true : void 0),
				...opt("export", v.export === true ? true : void 0),
				...opt("wrap", v.wrap === true ? true : void 0),
				...opt("filter", str(v.filter, 64)),
				...opt("filterColumn", int(v.filterColumn, 0, GENUI_LIMITS.maxTableCols - 1)),
				...opt("sortField", str(v.sortField, 64)),
				...opt("details", details !== void 0 && details.some((d) => d !== null) ? details : void 0)
			};
		}
		case "chart": {
			const data = repairChartData(v.data, GENUI_LIMITS.maxChartPoints);
			const series = Array.isArray(v.series) ? repairSeries(v.series, GENUI_LIMITS.maxPlotSeries, GENUI_LIMITS.maxChartPoints) : void 0;
			if (data === void 0 && series === void 0) return null;
			return {
				type: "chart",
				data: data ?? [],
				...opt("kind", enu(v.kind, CHART_KINDS)),
				...opt("series", series),
				...opt("horizontal", v.horizontal === true ? true : void 0),
				...opt("stacked", v.stacked === true ? true : void 0),
				...opt("filter", str(v.filter, 64)),
				...opt("palette", paletteValues(v.palette))
			};
		}
		case "tabs": {
			const tabs = repairTabs(v.tabs, ctx, depth);
			if (tabs === void 0) return null;
			return {
				type: "tabs",
				tabs
			};
		}
		case "plot": {
			const series = repairPlotSeries(v.series, GENUI_LIMITS.maxPlotSeries);
			if (series === void 0) return null;
			return {
				type: "plot",
				series,
				...opt("xMin", num(v.xMin, -1e6, 1e6)),
				...opt("xMax", num(v.xMax, -1e6, 1e6)),
				...opt("yMin", num(v.yMin, -1e9, 1e9)),
				...opt("yMax", num(v.yMax, -1e9, 1e9)),
				...opt("title", str(v.title, GENUI_LIMITS.maxString))
			};
		}
		case "callout": {
			const content = str(v.content, GENUI_LIMITS.maxString);
			if (content === void 0) return null;
			return {
				type: "callout",
				content,
				...opt("tone", enu(v.tone, CALLOUT_TONES)),
				...opt("title", str(v.title, GENUI_LIMITS.maxString))
			};
		}
		case "steps": {
			const steps = repairSteps(v.steps);
			if (steps === void 0) return null;
			return {
				type: "steps",
				steps,
				...opt("current", int(v.current, 0, steps.length))
			};
		}
		case "keyvalue": {
			const pairs = repairPairs(v.pairs, GENUI_LIMITS.maxKeyValuePairs);
			if (pairs === void 0) return null;
			return {
				type: "keyvalue",
				pairs
			};
		}
		case "diff": {
			const diffs = repairDiffs(v.diffs);
			if (diffs === void 0) return null;
			return {
				type: "diff",
				diffs
			};
		}
		case "json":
			if (!("value" in v)) return null;
			return {
				type: "json",
				value: v.value
			};
		case "code": {
			const code = str(v.code, GENUI_LIMITS.maxCode);
			if (code === void 0) return null;
			return {
				type: "code",
				code,
				...opt("lang", str(v.lang, 64))
			};
		}
		case "radio": {
			const options = repairStrings(v.options, GENUI_LIMITS.maxOptions, GENUI_LIMITS.maxString);
			if (options === void 0) return null;
			return {
				type: "radio",
				options,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("selected", int(v.selected, 0, options.length - 1)),
				...opt("action", str(v.action, 200)),
				...opt("group", str(v.group, 200)),
				...opt("answer", typeof v.answer === "number" && Number.isFinite(v.answer) && v.answer >= 0 && v.answer < options.length ? Math.trunc(v.answer) : typeof v.answer === "string" ? v.answer.slice(0, 512) : void 0),
				...opt("explanation", str(v.explanation, GENUI_LIMITS.maxString))
			};
		}
		case "submit": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			const action = str(v.action, 200);
			if (label === void 0) return null;
			return {
				type: "submit",
				label,
				...opt("action", action),
				...opt("resetAction", str(v.resetAction, 200)),
				...opt("groups", repairStrings(v.groups, GENUI_LIMITS.maxOptions, 200))
			};
		}
		case "switch": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "switch",
				label,
				...opt("checked", v.checked === true ? true : void 0),
				...opt("action", str(v.action, 200))
			};
		}
		case "slider": {
			const min = num(v.min, -1e9, 1e9) ?? 0;
			const max = num(v.max, -1e9, 1e9) ?? 100;
			const lo = Math.min(min, max);
			const hi = Math.max(min, max);
			const step = num(v.step, 1e-9, Math.max(hi - lo, 1e-9));
			const value = num(v.value, lo, hi) ?? lo;
			return {
				type: "slider",
				min: lo,
				max: hi,
				...opt("step", step),
				value,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("action", str(v.action, 200)),
				...opt("id", str(v.id, 200))
			};
		}
		case "textarea": return {
			type: "textarea",
			...opt("label", str(v.label, GENUI_LIMITS.maxString)),
			...opt("placeholder", str(v.placeholder, GENUI_LIMITS.maxString)),
			...opt("rows", int(v.rows, 1, 30)),
			...opt("value", str(v.value, GENUI_LIMITS.maxString)),
			...opt("action", str(v.action, 200)),
			...opt("id", str(v.id, 200))
		};
		case "accordion": {
			const items = repairAccordion(v.items, ctx, depth);
			if (items === void 0) return null;
			return {
				type: "accordion",
				items
			};
		}
		case "copy": {
			const text = str(v.text, GENUI_LIMITS.maxCode);
			if (text === void 0) return null;
			return {
				type: "copy",
				text,
				...opt("label", str(v.label, 128)),
				...opt("expandable", typeof v.expandable === "boolean" ? v.expandable : void 0),
				...opt("previewLines", int(v.previewLines, 0, GENUI_LIMITS.maxCopyPreviewLines))
			};
		}
		case "svg": {
			const code = v.code;
			if (typeof code !== "string" || code.length > GENUI_LIMITS.maxCode) return null;
			return {
				type: "svg",
				code,
				...opt("title", str(v.title, GENUI_LIMITS.maxString)),
				...opt("height", int(v.height, 100, 800))
			};
		}
		case "mermaid": {
			const code = str(v.code, GENUI_LIMITS.maxMermaid);
			if (code === void 0) return null;
			return {
				type: "mermaid",
				code
			};
		}
		case "map": return repairMap(v);
		case "scene3d": {
			const meshes = repairMeshes(v.meshes);
			if (meshes === void 0) return null;
			return {
				type: "scene3d",
				meshes,
				...opt("title", str(v.title, GENUI_LIMITS.maxString)),
				...opt("ambient", num(v.ambient, 0, 2)),
				...opt("background", color(v.background))
			};
		}
		case "diagram": return repairDiagram(v);
		case "timeline": {
			const items = repairTimeline(v.items, GENUI_LIMITS.maxTimelineItems);
			if (items === void 0) return null;
			return {
				type: "timeline",
				items
			};
		}
		case "file-tree": {
			const items = repairTree(v.items, GENUI_LIMITS.maxListItems, ctx);
			if (items === void 0) return null;
			return {
				type: "file-tree",
				items
			};
		}
		case "breadcrumb": {
			const items = repairStrings(v.items, GENUI_LIMITS.maxBreadcrumbItems, GENUI_LIMITS.maxString);
			if (items === void 0) return null;
			return {
				type: "breadcrumb",
				items
			};
		}
		case "quiz": {
			const question = str(v.question, GENUI_LIMITS.maxString);
			const options = repairQuizOptions(v.options, v.answer);
			if (question === void 0 || options === void 0) return null;
			return {
				type: "quiz",
				question,
				options,
				...opt("explanation", str(v.explanation, GENUI_LIMITS.maxString)),
				...opt("id", str(v.id, 200)),
				...opt("action", str(v.action, 200))
			};
		}
		case "echart": {
			const data = v.data !== void 0 ? repairChartData(v.data, GENUI_LIMITS.maxChartPoints) : void 0;
			const series = v.series !== void 0 && Array.isArray(v.series) ? repairSeries(v.series, GENUI_LIMITS.maxPlotSeries, GENUI_LIMITS.maxChartPoints) : void 0;
			const links = Array.isArray(v.links) ? v.links.slice(0, GENUI_LIMITS.maxChartPoints).flatMap((entry) => {
				const e = obj(entry);
				const from = e === void 0 ? void 0 : str(e.from, 64);
				const to = e === void 0 ? void 0 : str(e.to, 64);
				if (from === void 0 || to === void 0) return [];
				return [{
					from,
					to,
					...opt("value", num(e.value, 0, 1e9))
				}];
			}) : void 0;
			const sanitized = v.option !== void 0 ? sanitizeEChartOption(v.option, 0, { count: GENUI_LIMITS.maxEChartOptionNodes }) : void 0;
			const option = sanitized === void 0 || typeof sanitized !== "object" || sanitized === null || Array.isArray(sanitized) ? void 0 : sanitized;
			if (option === void 0 && data === void 0 && series === void 0 && (links === void 0 || links.length === 0)) return null;
			return {
				type: "echart",
				...opt("title", str(v.title, GENUI_LIMITS.maxString)),
				...opt("height", int(v.height, 100, 800)),
				...opt("preset", enu(v.preset, ECHART_PRESETS)),
				...opt("data", data),
				...opt("series", series),
				...opt("links", links !== void 0 && links.length > 0 ? links : void 0),
				...opt("palette", paletteValues(v.palette)),
				...opt("option", option)
			};
		}
		default: return null;
	}
}
function repairStrings(v, cap, strCap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= cap) break;
		if (typeof item === "string") out.push(item.slice(0, strCap));
		else if (item !== null && typeof item === "object") {
			const o = item;
			const s = typeof o.label === "string" ? o.label : typeof o.value === "string" ? o.value : typeof o.title === "string" ? o.title : JSON.stringify(item);
			out.push(s.slice(0, strCap));
		}
	}
	return out;
}
function repairListItems(v, cap, ctx, depth) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= cap) {
			if (isRepairableListItem(item, depth)) ctx.truncatedListItems += 1;
			continue;
		}
		if (typeof item === "string") {
			out.push(item.slice(0, GENUI_LIMITS.maxString));
			continue;
		}
		const o = obj(item);
		if (o !== void 0 && typeof o.type === "string") {
			if (ctx.remaining <= 0) break;
			ctx.remaining -= 1;
			const node = repairNode(o, ctx, depth);
			if (node !== null) out.push(node);
			continue;
		}
		const title = o === void 0 ? void 0 : str(o.title, GENUI_LIMITS.maxString);
		if (title !== void 0) out.push({
			title,
			...opt("desc", str(o?.desc, GENUI_LIMITS.maxString))
		});
	}
	return out;
}
/** 判断超出列表上限的项目是否本可由 repair 保留。 */
function isRepairableListItem(item, depth) {
	if (typeof item === "string") return true;
	const o = obj(item);
	if (o === void 0) return false;
	if (typeof o.type === "string") return repairNode(o, {
		remaining: GENUI_LIMITS.maxNodes,
		truncatedTableRows: 0,
		truncatedListItems: 0,
		truncatedFileTreeItems: 0
	}, depth) !== null;
	return str(o.title, GENUI_LIMITS.maxString) !== void 0;
}
function repairChartData(v, cap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const datum of v) {
		if (out.length >= cap) break;
		const o = obj(datum);
		const label = o === void 0 ? void 0 : str(o.label, 128);
		const value = o === void 0 ? void 0 : num(o.value, -0xe8d4a51000, 0xe8d4a51000);
		const reference = o === void 0 ? void 0 : repairComputedRef(o.value);
		if (label === void 0 || value === void 0 && reference === void 0) continue;
		out.push({
			label,
			value: value ?? reference,
			...opt("color", o === void 0 ? void 0 : color(o.color))
		});
	}
	return out;
}
function repairSeries(v, cap, pointCap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const s of v) {
		if (out.length >= cap) break;
		const o = obj(s);
		const label = o === void 0 ? void 0 : str(o.label, 128);
		const data = o === void 0 ? void 0 : repairChartData(o.data, pointCap);
		if (label === void 0 || data === void 0) continue;
		out.push({
			label,
			data,
			...opt("color", o === void 0 ? void 0 : color(o.color))
		});
	}
	return out;
}
function repairTabs(v, ctx, depth) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const tab of v) {
		if (out.length >= GENUI_LIMITS.maxTabs) break;
		const o = obj(tab);
		const label = o === void 0 ? void 0 : str(o.label, 128);
		if (label === void 0 || o === void 0) continue;
		const rawItems = o.items !== void 0 ? o.items : o.content !== void 0 ? Array.isArray(o.content) ? o.content : [o.content] : void 0;
		if (Array.isArray(rawItems)) out.push({
			label,
			items: repairItems(rawItems, ctx, depth + 1)
		});
	}
	return out;
}
function repairPlotSeries(v, cap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const s of v) {
		if (out.length >= cap) break;
		const o = obj(s);
		const expr = o === void 0 ? void 0 : str(o.expr, 512);
		if (expr === void 0 || o === void 0) continue;
		const params = [];
		if (Array.isArray(o.params)) for (const p of o.params) {
			if (params.length >= GENUI_LIMITS.maxPlotParams) break;
			const po = obj(p);
			const name = po === void 0 ? void 0 : str(po.name, 64);
			const value = po === void 0 ? void 0 : num(po.value, -1e9, 1e9);
			if (name === void 0 || value === void 0) continue;
			params.push({
				name,
				value,
				...opt("min", po === void 0 ? void 0 : num(po.min, -1e9, 1e9)),
				...opt("max", po === void 0 ? void 0 : num(po.max, -1e9, 1e9)),
				...opt("step", po === void 0 ? void 0 : num(po.step, 1e-9, 1e9)),
				...opt("animateTo", po === void 0 ? void 0 : num(po.animateTo, -1e9, 1e9)),
				...opt("durationMs", po === void 0 ? void 0 : num(po.durationMs, 1, 12e4)),
				...opt("loop", po === void 0 ? void 0 : po.loop === true ? true : void 0)
			});
		}
		out.push({
			expr,
			...opt("label", str(o.label, 128)),
			...opt("color", color(o.color)),
			...opt("kind", enu(o.kind, PLOT_KINDS)),
			...opt("params", params.length > 0 ? params : void 0)
		});
	}
	return out;
}
function repairSteps(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const s of v) {
		if (out.length >= GENUI_LIMITS.maxSteps) break;
		const o = obj(s);
		const title = o === void 0 ? void 0 : str(o.title, 256);
		if (title === void 0) continue;
		out.push({
			title,
			...opt("desc", o === void 0 ? void 0 : str(o.desc, GENUI_LIMITS.maxString))
		});
	}
	return out;
}
function repairPairs(v, cap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const p of v) {
		if (out.length >= cap) break;
		const o = obj(p);
		const key = o === void 0 ? void 0 : str(o.key, 256);
		const value = o === void 0 ? void 0 : str(o.value, GENUI_LIMITS.maxString);
		if (key === void 0 || value === void 0) continue;
		out.push({
			key,
			value
		});
	}
	return out;
}
function repairDiffs(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const d of v) {
		if (out.length >= 24) break;
		const o = obj(d);
		const path = o === void 0 ? void 0 : str(o.path, 1024);
		const newText = o === void 0 ? void 0 : str(o.newText, 2e4);
		if (path === void 0 || newText === void 0) continue;
		const old = o === void 0 ? void 0 : o.oldText;
		out.push({
			path,
			newText,
			oldText: old === null || typeof old !== "string" ? null : old.slice(0, 2e4)
		});
	}
	return out;
}
function repairAccordion(v, ctx, depth) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= GENUI_LIMITS.maxAccordionItems) break;
		const o = obj(item);
		const title = o === void 0 ? void 0 : str(o.title, 256);
		if (title === void 0 || o === void 0) continue;
		out.push({
			title,
			items: repairItems(o.items, ctx, depth + 1)
		});
	}
	return out;
}
function repairMeshes(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const m of v) {
		if (out.length >= GENUI_LIMITS.maxMeshes) break;
		const o = obj(m);
		const shape = o === void 0 ? void 0 : enu(o.shape, MESH_SHAPES);
		if (shape === void 0) continue;
		const scale = o === void 0 ? void 0 : num(o.scale, -1e6, 1e6) ?? tuple3(o.scale);
		const size = o === void 0 ? void 0 : num(o.size, -1e6, 1e6) ?? tuple3(o.size);
		out.push({
			shape,
			...opt("color", o === void 0 ? void 0 : color(o.color)),
			...opt("position", o === void 0 ? void 0 : tuple3(o.position)),
			...opt("rotation", o === void 0 ? void 0 : tuple3(o.rotation)),
			...opt("scale", scale),
			...opt("size", size)
		});
	}
	return out;
}
function tuple3(v) {
	if (!Array.isArray(v) || v.length !== 3) return void 0;
	const [a, b, c] = v;
	if (typeof a !== "number" || !Number.isFinite(a) || typeof b !== "number" || !Number.isFinite(b) || typeof c !== "number" || !Number.isFinite(c)) return void 0;
	return [
		Math.min(1e6, Math.max(-1e6, a)),
		Math.min(1e6, Math.max(-1e6, b)),
		Math.min(1e6, Math.max(-1e6, c))
	];
}
/** Clamp a coordinate/size to the 4px editorial grid. */
function grid4(v, min, max) {
	return Math.min(max, Math.max(min, Math.round(v / 4) * 4));
}
function repairDiagramNodes(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const raw of v) {
		if (out.length >= GENUI_LIMITS.maxDiagramNodes) break;
		const o = obj(raw);
		if (o === void 0) continue;
		const id = str(o.id, 128);
		const label = str(o.label, GENUI_LIMITS.maxString);
		if (id === void 0 || label === void 0) continue;
		if (seen.has(id)) continue;
		seen.add(id);
		const nodeType = enu(o.type, DIAGRAM_NODE_TYPES);
		const x = o.x === void 0 ? void 0 : grid4(num(o.x, -1e6, 1e6) ?? 0, 0, 1e6);
		const y = o.y === void 0 ? void 0 : grid4(num(o.y, -1e6, 1e6) ?? 0, 0, 1e6);
		const w = o.w === void 0 ? void 0 : grid4(num(o.w, -1e6, 1e6) ?? 96, 40, 2e3);
		const h = o.h === void 0 ? void 0 : grid4(num(o.h, -1e6, 1e6) ?? 48, 24, 1200);
		out.push({
			id,
			label,
			...opt("sub", str(o.sub, 256)),
			...opt("description", str(o.description, GENUI_LIMITS.maxString)),
			...opt("type", nodeType),
			...opt("x", x),
			...opt("y", y),
			...opt("w", w),
			...opt("h", h),
			...opt("tag", str(o.tag, 32))
		});
	}
	return out;
}
function repairDiagramEdges(v) {
	if (v === void 0) return [];
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const raw of v) {
		if (out.length >= GENUI_LIMITS.maxDiagramEdges) break;
		const o = obj(raw);
		if (o === void 0) continue;
		const from = str(o.from, 128);
		const to = str(o.to, 128);
		if (from === void 0 || to === void 0) continue;
		out.push({
			from,
			to,
			...opt("label", str(o.label, GENUI_LIMITS.maxDiagramLabel)),
			...opt("kind", enu(o.kind, DIAGRAM_EDGE_KINDS)),
			...opt("route", enu(o.route, DIAGRAM_ROUTES))
		});
	}
	return out;
}
function repairDiagramTheme(v) {
	const o = obj(v);
	if (o === void 0) return void 0;
	const out = {};
	for (const key of [
		"paper",
		"paper-2",
		"ink",
		"muted",
		"soft",
		"rule",
		"accent",
		"accent-tint",
		"link"
	]) {
		const c = color(o[key]);
		if (c !== void 0) out[key] = c;
	}
	return Object.keys(out).length === 0 ? void 0 : out;
}
function repairDiagramZones(v) {
	if (v === void 0) return [];
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const raw of v) {
		if (out.length >= GENUI_LIMITS.maxDiagramZones) break;
		const o = obj(raw);
		if (o === void 0) continue;
		const label = str(o.label, 64);
		if (label === void 0) continue;
		out.push({
			label,
			...opt("x", o.x === void 0 ? void 0 : grid4(num(o.x, -1e6, 1e6) ?? 0, 0, 1e6)),
			...opt("y", o.y === void 0 ? void 0 : grid4(num(o.y, -1e6, 1e6) ?? 0, 0, 1e6)),
			...opt("w", o.w === void 0 ? void 0 : grid4(num(o.w, -1e6, 1e6) ?? 100, 40, 2e3)),
			...opt("h", o.h === void 0 ? void 0 : grid4(num(o.h, -1e6, 1e6) ?? 100, 40, 1200))
		});
	}
	return out;
}
function repairDiagram(v) {
	const o = obj(v);
	if (o === void 0) return null;
	const kind = enu(o.kind, DIAGRAM_KINDS);
	if (kind === void 0) return null;
	const nodes = repairDiagramNodes(o.nodes);
	if (nodes === void 0) return null;
	const edges = repairDiagramEdges(o.edges);
	if (edges === void 0) return null;
	const zones = repairDiagramZones(o.zones);
	if (zones === void 0) return null;
	return {
		type: "diagram",
		kind,
		nodes,
		edges,
		...opt("id", str(o.id, 128)),
		...opt("zones", zones.length > 0 ? zones : void 0),
		...opt("variant", enu(o.variant, DIAGRAM_VARIANTS)),
		...opt("title", str(o.title, 256)),
		...opt("theme", repairDiagramTheme(o.theme))
	};
}
function repairTimeline(v, cap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= cap) break;
		const o = obj(item);
		const title = o === void 0 ? void 0 : str(o.title, 256);
		if (title === void 0) continue;
		out.push({
			title,
			...opt("desc", o === void 0 ? void 0 : str(o.desc, GENUI_LIMITS.maxString)),
			...opt("time", o === void 0 ? void 0 : str(o.time, 128))
		});
	}
	return out;
}
/** 按每层节点上限修复文件树并累计略过的有效节点。 */
function repairTree(v, cap, ctx) {
	return walkTree(v, cap, GENUI_LIMITS.maxTreeDepth, ctx);
}
/** 递归修复文件树的每一层，并记录各层上限之外的有效节点。 */
function walkTree(v, cap, depthLeft, ctx) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		const o = obj(item);
		const name = o === void 0 ? void 0 : str(o.name, 256);
		if (name === void 0) continue;
		if (out.length >= cap) {
			ctx.truncatedFileTreeItems += 1;
			continue;
		}
		const children = o !== void 0 && depthLeft > 0 && Array.isArray(o.children) ? walkTree(o.children, cap, depthLeft - 1, ctx) : void 0;
		out.push({
			name,
			...opt("type", o === void 0 ? void 0 : enu(o.type, FILE_TYPES)),
			...opt("children", children)
		});
	}
	return out;
}
function repairQuizOptions(v, answer) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const optItem of v) {
		if (out.length >= GENUI_LIMITS.maxQuizOptions) break;
		const o = obj(optItem);
		const label = typeof optItem === "string" ? str(optItem, 512) : o === void 0 ? void 0 : str(o.label, 512);
		if (label === void 0) continue;
		out.push({
			label,
			...opt("correct", o === void 0 ? void 0 : o.correct === true ? true : void 0),
			...opt("feedback", o === void 0 ? void 0 : str(o.feedback, GENUI_LIMITS.maxString))
		});
	}
	if (out.length === 0) return void 0;
	if (out.some((option) => option.correct === true)) return out;
	const answerIndex = typeof answer === "number" && Number.isFinite(answer) ? Math.trunc(answer) : typeof answer === "string" ? out.findIndex((option) => option.label === answer.slice(0, 512)) : -1;
	if (answerIndex < 0 || answerIndex >= out.length) return out;
	return out.map((option, index) => index === answerIndex ? {
		...option,
		correct: true
	} : option);
}
/**
* Patterns that indicate HTML/script injection in a string field. ECharts
* default `tooltip.renderMode: 'html'` writes tooltip content via
* `innerHTML`; even with renderMode forced to 'richText' (see below),
* filtering these patterns is defense-in-depth — a model (or a
* prompt-injected model) should never emit `<script>`, `onerror=`, or
* `javascript:` inside a chart option string.
*/
const ECHART_HTML_DANGER_RE = /<(?:script|img|svg|iframe|video|audio|object|embed|source)\b|on[a-z]+\s*=|javascript:/i;
/**
* Sanitize an ECharts option object: depth-bounded, budget-bounded
* pass-through that strips dangerous values (functions, `url()` in styles,
* HTML/script injection patterns in strings) but preserves the object shape
* ECharts needs. Scalars are KEPT: ECharts options are full of them,
* including inside `data` arrays (`data: [120, 150, 180]`,
* `xAxis.data: ['1月', '2月']`). Previously a scalar hit the plain-object
* gate below and returned undefined, so every primitive-valued array was
* filtered to empty and dropped — a chart with a full `option` rendered
* with empty series (blank canvas). This is a safety walk, not an ECharts
* semantic validator.
*
* Security: `tooltip.renderMode` is forced to `'richText'` on every tooltip
* object. ECharts' default `'html'` mode writes tooltip content via
* `innerHTML`, which is an XSS vector when the option originates from model
* output — a prompt-injected model could emit
* `{"tooltip":{"formatter":"<img src=x onerror=...>"}}` and execute
* arbitrary script. `richText` renders as text, never touching innerHTML.
*/
function sanitizeEChartOption(v, depth, budget) {
	if (budget.count <= 0) return void 0;
	budget.count -= 1;
	if (depth > GENUI_LIMITS.maxEChartOptionDepth) return void 0;
	if (typeof v === "string") {
		const s = v.slice(0, GENUI_LIMITS.maxString);
		if (s.toLowerCase().includes("url(") || ECHART_HTML_DANGER_RE.test(s)) return void 0;
		return s;
	}
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "boolean") return v;
	if (v === null) return null;
	if (Array.isArray(v)) {
		const cap = Math.min(v.length, GENUI_LIMITS.maxEChartArrayLen);
		const arr = [];
		for (let i = 0; i < cap; i++) {
			const s = sanitizeEChartOption(v[i], depth + 1, budget);
			if (s !== void 0) arr.push(s);
		}
		return arr.length > 0 || v.length === 0 ? arr : void 0;
	}
	const o = obj(v);
	if (o === void 0) return void 0;
	const out = {};
	for (const [key, val] of Object.entries(o)) {
		const s = sanitizeEChartOption(val, depth + 1, budget);
		if (s === void 0) continue;
		if (key === "tooltip" && typeof s === "object" && s !== null && !Array.isArray(s)) s.renderMode = "richText";
		out[key] = s;
	}
	return Object.keys(out).length > 0 || Object.keys(o).length === 0 ? out : void 0;
}
function repairComputedFields(value) {
	if (!Array.isArray(value)) return void 0;
	const output = [];
	for (const entry of value.slice(0, GENUI_LIMITS.maxComputedFields)) {
		const item = obj(entry);
		const id = item !== void 0 && typeof item.id === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(item.id) ? item.id : void 0;
		const expr = item === void 0 ? void 0 : str(item.expr, SAFE_MATH_LIMITS.maxExpressionLength);
		if (id === void 0 || expr === void 0 || item === void 0 || typeof item.expr !== "string" || item.expr.length > SAFE_MATH_LIMITS.maxExpressionLength) continue;
		const rawFormat = obj(item.format);
		let format;
		if (rawFormat !== void 0) {
			const style = enu(rawFormat.style, [
				"decimal",
				"currency",
				"percent"
			]) ?? "decimal";
			const currency = typeof rawFormat.currency === "string" && /^[A-Z]{3}$/.test(rawFormat.currency) ? rawFormat.currency : void 0;
			const locale = typeof rawFormat.locale === "string" && isValidComputedLocale(rawFormat.locale) ? rawFormat.locale.slice(0, 35) : void 0;
			const minimumFractionDigits = int(rawFormat.minimumFractionDigits, 0, 12);
			const maximumFractionDigits = int(rawFormat.maximumFractionDigits, 0, 12);
			if ((style !== "currency" || currency !== void 0) && (minimumFractionDigits === void 0 || maximumFractionDigits === void 0 || minimumFractionDigits <= maximumFractionDigits)) format = {
				style,
				...opt("currency", currency),
				...opt("locale", locale),
				...opt("minimumFractionDigits", minimumFractionDigits),
				...opt("maximumFractionDigits", maximumFractionDigits)
			};
		}
		output.push({
			id,
			expr,
			...opt("format", format)
		});
	}
	return output;
}
/** 检查 locale 标签是否符合 Intl 的语言标签规则。 */
function isValidComputedLocale(locale) {
	if (locale.length > 35) return false;
	try {
		return Intl.getCanonicalLocales(locale).length === 1;
	} catch {
		return false;
	}
}
function repairComputedRef(value) {
	const reference = obj(value);
	if (reference === void 0 || Object.keys(reference).length !== 1) return void 0;
	const id = reference.$computed;
	return typeof id === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(id) ? { $computed: id } : void 0;
}
/**
* Deterministically repair a raw spec value into a renderable GenuiSpec.
* Returns null only when the root is not an object with an `items` array
* (a bare component root is wrapped into a col first — the documented fence
* vocabulary allows single-component bodies); every other defect is healed by
* dropping/clamping/truncating. Idempotent: repairing a repaired spec is a
* no-op.
*/
function repairCanonicalGenuiSpec(value, ctx = {
	remaining: GENUI_LIMITS.maxNodes,
	truncatedTableRows: 0,
	truncatedListItems: 0,
	truncatedFileTreeItems: 0
}) {
	const v = obj(value);
	if (v === void 0) return null;
	if (isComponentRoot(value)) {
		const wrapped = wrapSingleComponentRoot(value);
		if (wrapped === null) return null;
		return repairCanonicalGenuiSpec(wrapped, ctx);
	}
	if (!Array.isArray(v.items)) return null;
	return {
		...opt("title", str(v.title, GENUI_LIMITS.maxString)),
		...opt("gap", num(v.gap, 0, 96)),
		...opt("panel", v.panel === true ? true : void 0),
		...opt("append", v.append === true ? true : void 0),
		...opt("computed", repairComputedFields(v.computed)),
		...opt("theme", repairTheme(v.theme)),
		items: repairItems(v.items, ctx, 0)
	};
}
/**
* Count the nodes of a spec tree (every item, descending into tabs /
* accordion / file-tree / list containers — the same descent
* `validateGenuiSpec` walks). Shared by the panel fold (node-budget gate)
* and validation, so the panel never runs a second, divergent traversal.
* `cap` bounds the walk for hostile inputs; the panel passes
* `PANEL_LIMITS.maxNodes + 1` to detect overflow without counting the whole
* tree.
*/
function countGenuiNodes(value, cap = Number.POSITIVE_INFINITY) {
	let count = 0;
	const walk = (list) => {
		if (!Array.isArray(list)) return;
		for (const item of list) {
			if (count >= cap) return;
			count += 1;
			const v = obj(item);
			if (v === void 0) continue;
			if (v.type === "tabs" && Array.isArray(v.tabs)) for (const t of v.tabs) {
				if (count >= cap) return;
				const to = obj(t);
				if (to !== void 0) walk(to.items);
			}
			else if (v.type === "accordion" && Array.isArray(v.items)) for (const it of v.items) {
				if (count >= cap) return;
				const io = obj(it);
				if (io !== void 0) walk(io.items);
			}
			else if ((v.type === "row" || v.type === "col" || v.type === "grid" || v.type === "card" || v.type === "carousel") && Array.isArray(v.items)) walk(v.items);
			else if (v.type === "file-tree") {} else if (v.type === "list" && Array.isArray(v.items)) for (const li of v.items) {
				if (count >= cap) return;
				const lo = obj(li);
				if (lo !== void 0 && typeof lo.type === "string") walk([lo]);
			}
			else if (v.type === "table" && Array.isArray(v.details)) {
				const rowCount = tableRowsForDetails(v).length;
				for (let rowIndex = 0; rowIndex < Math.min(v.details.length, rowCount); rowIndex++) {
					if (count >= cap) return;
					const detail = v.details[rowIndex];
					if (Array.isArray(detail) && isTableDetailReachable(v, rowIndex)) walk(detail);
				}
			}
		}
	};
	const root = obj(value);
	walk(root === void 0 ? [] : root.items);
	return count;
}
/** Every white-listed node `type`. Keep in sync with the repairNode switch —
* validate_dsh_ui uses it to tell declared GenUI nodes apart from unrelated
* `"type"` strings (e.g. file-tree's `{type:'file'}` children). */
const GENUI_NODE_TYPES = GENUI_NATIVE_TYPES;
/**
* Visit and count declared nodes in a raw spec tree: objects whose `type` is a
* white-listed string, descending the same containers `countGenuiNodes`
* walks. Callers can inspect field semantics or compare the count with the
* repaired tree without maintaining another traversal.
*
* With `familyCaps` (default) the traversal applies the same per-family
* policy caps repair enforces (tabs ≤ maxTabs, accordion items ≤
* maxAccordionItems, carousel items ≤ maxCarouselItems): nodes beyond a cap are policy-truncated, not defects,
* so the declared-vs-rendered ledger must not count them as vanished (#298).
*/
function visitDeclaredGenuiNodes(value, cap, visit, options = {}) {
	const familyCaps = options.familyCaps !== false;
	const carouselCaps = options.carouselCaps ?? familyCaps;
	let count = 0;
	const declared = (candidate) => {
		const o = obj(candidate);
		return o !== void 0 && typeof o.type === "string" && GENUI_NODE_TYPES.has(o.type);
	};
	function walk(list, path, depth) {
		if (!Array.isArray(list)) return;
		for (let index = 0; index < list.length; index++) {
			walkNode(list[index], `${path}[${index}]`, depth);
			if (count >= cap) return;
		}
	}
	function walkNode(item, at, depth) {
		if (count >= cap || !declared(item)) return;
		const v = obj(item);
		if (v === void 0) return;
		count += 1;
		visit(v, at);
		if (v.type === "tabs" && Array.isArray(v.tabs)) {
			const tabCount = familyCaps ? Math.min(v.tabs.length, GENUI_LIMITS.maxTabs) : v.tabs.length;
			for (let tab = 0; tab < tabCount; tab++) walkItemsOf(v.tabs[tab], `${at}.tabs[${tab}]`, depth + 1);
		} else if (v.type === "accordion" && Array.isArray(v.items)) {
			const rowCount = familyCaps ? Math.min(v.items.length, GENUI_LIMITS.maxAccordionItems) : v.items.length;
			for (let row = 0; row < rowCount; row++) walkItemsOf(v.items[row], `${at}.items[${row}]`, depth + 1);
		} else if ((v.type === "row" || v.type === "col" || v.type === "grid" || v.type === "card" || v.type === "carousel") && Array.isArray(v.items)) walk(v.type === "carousel" && carouselCaps ? v.items.slice(0, GENUI_LIMITS.maxCarouselItems) : v.items, `${at}.items`, depth + 1);
		else if (v.type === "list" && Array.isArray(v.items)) {
			let keptItems = 0;
			for (let row = 0; row < v.items.length; row++) {
				const item = v.items[row];
				if (!isRepairableListItem(item, depth + 1)) continue;
				if (keptItems >= GENUI_LIMITS.maxListItems) break;
				keptItems += 1;
				walkNode(item, `${at}.items[${row}]`, depth + 1);
			}
		} else if (v.type === "table" && Array.isArray(v.details)) {
			const rowCount = tableRowsForDetails(v).length;
			for (let row = 0; row < Math.min(v.details.length, rowCount); row++) if (Array.isArray(v.details[row]) && isTableDetailReachable(v, row)) walk(v.details[row], `${at}.details[${row}]`, depth + 1);
		}
	}
	function walkItemsOf(holder, path, depth) {
		const o = obj(holder);
		if (o === void 0) return;
		const items = o.items !== void 0 ? o.items : o.content;
		if (Array.isArray(items)) walk(items, `${path}.items`, depth);
		else walkNode(items, `${path}.items`, depth);
	}
	const root = obj(value);
	if (root === void 0) return count;
	if (isComponentRoot(root) && declared(value)) walkNode(value, "spec", 0);
	else walk(root.items, "items", 0);
	return count;
}
/**
* Count white-listed nodes declared by a raw spec before repair drops invalid entries.
* @param value - raw GenUI spec.
* @param cap - traversal ceiling.
* @param options - `familyCaps: false` counts beyond per-family policy caps; `carouselCaps: true` keeps the carousel item cap.
* @returns declared node count up to the ceiling.
*/
function countDeclaredGenuiNodes(value, cap = Number.POSITIVE_INFINITY, options = {}) {
	return visitDeclaredGenuiNodes(value, cap, () => {}, options);
}
/** Count native nodes that survived repair, excluding opaque custom nodes. */
function countRenderedNativeGenuiNodes(value, cap = Number.POSITIVE_INFINITY) {
	return countDeclaredGenuiNodes(value, cap);
}
function deferPanelReferences(spec, options) {
	return options.panelOperation === "append" || options.deferPanelReferences === true && spec.panel === true && spec.append === true;
}
/**
* 检查字段显隐条件之间的循环引用。
*
* @param spec - 修复后的 GenUI 文档。
* @returns 循环依赖错误列表。
*/
function validateWhenDependencyCycles(spec) {
	const registry = analyzeSubmissionRegistry(spec).registry;
	const dependencies = /* @__PURE__ */ new Map();
	walkGenuiNodes(spec, (node, path, ancestorConditions) => {
		const fieldId = "id" in node && typeof node.id === "string" && registry.members.get(node.id)?.kind === "field" ? node.id : void 0;
		const group = node.type === "radio" || node.type === "checkbox" || node.type === "choices" ? node.group : void 0;
		const key = fieldId ?? group;
		if (key === void 0) return;
		const edges = dependencies.get(key) ?? [];
		for (const ancestor of ancestorConditions) edges.push({
			field: ancestor.condition.field,
			path: ancestor.path
		});
		if (node.when !== void 0) edges.push({
			field: node.when.field,
			path: `${path}.when.field`
		});
		dependencies.set(key, edges);
	});
	const errors = [];
	const visited = /* @__PURE__ */ new Set();
	const active = /* @__PURE__ */ new Set();
	const visit = (key) => {
		if (visited.has(key)) return;
		active.add(key);
		for (const edge of dependencies.get(key) ?? []) {
			if (active.has(edge.field)) {
				errors.push(`${edge.path}: circular visibility dependency involving '${edge.field}'`);
				continue;
			}
			visit(edge.field);
		}
		active.delete(key);
		visited.add(key);
	};
	dependencies.forEach((_edges, key) => visit(key));
	return errors;
}
/**
* 检查 GenUI 文档的白名单和限制，并收集可读的错误信息，不会修改文档。
*
* @param value - 未经过别名转换的 GenUI 文档。
* @returns 完整结构与字段校验结果。
*/
function validateCanonicalGenuiSpec(value, options = {}) {
	const errors = [];
	const v = obj(value);
	if (v === void 0) return {
		ok: false,
		errors: ["spec root must be an object"]
	};
	if (isComponentRoot(value)) {
		const wrapped = wrapSingleComponentRoot(value);
		if (wrapped !== null) return validateCanonicalGenuiSpec(wrapped, options);
		return {
			ok: false,
			errors: ["spec.items must be an array"]
		};
	}
	if (!Array.isArray(v.items)) return {
		ok: false,
		errors: ["spec.items must be an array"]
	};
	validateSchemaFieldKinds(v, "spec", GENUI_SPEC_SCHEMA, errors, ["items"]);
	validateNestedRecordSchemas(v, "spec", GENUI_SPEC_SCHEMA, errors);
	if (Array.isArray(v.computed)) {
		if (v.computed.length > GENUI_LIMITS.maxComputedFields) errors.push(`spec.computed exceeds ${GENUI_LIMITS.maxComputedFields} fields`);
		for (const [index, entry] of v.computed.slice(0, GENUI_LIMITS.maxComputedFields).entries()) {
			const formula = obj(entry);
			if (formula === void 0) continue;
			const at = `spec.computed[${index}]`;
			if (typeof formula.id === "string" && !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(formula.id)) errors.push(`${at}.id must be a field name of at most 64 characters`);
			if (typeof formula.expr === "string" && formula.expr.length > SAFE_MATH_LIMITS.maxExpressionLength) errors.push(`${at}.expr exceeds ${SAFE_MATH_LIMITS.maxExpressionLength} characters`);
			const format = obj(formula.format);
			if (format !== void 0) {
				const style = format.style;
				if (style !== void 0 && ![
					"decimal",
					"currency",
					"percent"
				].includes(String(style))) errors.push(`${at}.format.style must be decimal, currency, or percent`);
				if (style === "currency" && (typeof format.currency !== "string" || !/^[A-Z]{3}$/.test(format.currency))) errors.push(`${at}.format.currency must be a three-letter uppercase currency code`);
				if (format.locale !== void 0 && (typeof format.locale !== "string" || !isValidComputedLocale(format.locale))) errors.push(`${at}.format.locale is invalid`);
				for (const field of ["minimumFractionDigits", "maximumFractionDigits"]) {
					const value = format[field];
					if (value !== void 0 && (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 12)) errors.push(`${at}.format.${field} must be an integer from 0 to 12`);
				}
				if (typeof format.minimumFractionDigits === "number" && typeof format.maximumFractionDigits === "number" && format.minimumFractionDigits > format.maximumFractionDigits) errors.push(`${at}.format.minimumFractionDigits cannot exceed maximumFractionDigits`);
			}
		}
	}
	const repaired = repairCanonicalGenuiSpec(v);
	if (repaired !== null) {
		errors.push(...validateWhenDependencyCycles(repaired));
		const append = deferPanelReferences(repaired, options);
		const graph = buildComputedGraph(repaired.computed ?? [], getComputedInputIds(repaired), /* @__PURE__ */ new Set(), append);
		for (const [id, error] of Object.entries(graph.errors)) errors.push(`spec.computed.${id}: ${error}`);
		validateComputedReferences(repaired.title, repaired.items, new Set((repaired.computed ?? []).map((field) => field.id)), errors, append);
	}
	let count = 0;
	let capped = false;
	const walk = (list, depth, path) => {
		if (capped) return;
		if (!Array.isArray(list)) {
			errors.push(`${path} must be an array`);
			return;
		}
		for (let i = 0; i < list.length; i++) {
			if (capped || count >= GENUI_LIMITS.maxNodes) {
				if (!capped) {
					errors.push(`spec exceeds ${GENUI_LIMITS.maxNodes} nodes; tail elided`);
					capped = true;
				}
				return;
			}
			count += 1;
			const at = `${path}[${i}]`;
			validateNode(list[i], depth, at, errors, walk);
		}
	};
	walk(v.items, 0, "items");
	if (errors.length === 0 && repaired !== null) errors.push(...analyzeSubmissionRegistry(repaired, deferPanelReferences(repaired, options)).diagnostics);
	if (repaired !== null) for (const id of getDuplicateComputedInputIds(repaired)) errors.push(`spec.items contains duplicate input field ID '${id}'`);
	const uniqueErrors = [...new Set(errors)];
	return {
		ok: uniqueErrors.length === 0,
		errors: uniqueErrors
	};
}
/**
* Run the shared canonical GenUI pipeline.
*
* The pipeline normalizes aliases, applies the existing deterministic repair
* and security filters, validates the canonical input, and reports native
* declarations that disappeared during repair. Unsupported types are errors.
*
* @param value - Raw GenUI spec or bare component.
* @returns Canonical input, repaired output, diagnostics, and node counts.
*/
function processGenuiSpec(value, options = {}) {
	const normalized = normalizeGenuiSpec(value);
	const repairCtx = {
		remaining: GENUI_LIMITS.maxNodes,
		truncatedTableRows: 0,
		truncatedListItems: 0,
		truncatedFileTreeItems: 0
	};
	const repaired = repairCanonicalGenuiSpec(normalized.value, repairCtx);
	const validation = validateCanonicalGenuiSpec(normalized.value, options);
	const declaredNativeCount = countDeclaredGenuiNodes(normalized.value, GENUI_LIMITS.maxNodes + 1);
	const uncappedPolicyNodeCount = countDeclaredGenuiNodes(normalized.value, GENUI_LIMITS.maxNodes + 1, {
		familyCaps: false,
		carouselCaps: true
	});
	const renderedNativeCount = repaired === null ? 0 : countRenderedNativeGenuiNodes(repaired);
	const renderedTotalCount = repaired === null ? 0 : countGenuiNodes(repaired);
	const errors = [...validation.errors];
	if (repaired !== null && errors.length === 0) errors.push(...analyzeSubmissionRegistry(repaired, deferPanelReferences(repaired, options)).diagnostics);
	if (declaredNativeCount > renderedNativeCount) errors.push(`repair dropped ${declaredNativeCount - renderedNativeCount} declared native node(s): declared ${declaredNativeCount}, rendered ${renderedNativeCount}`);
	const warnings = [...normalized.warnings, ...diagnoseUnknownGenuiFields(normalized.value)];
	let carouselItemOverflow = 0;
	let imageGroupOverflow = 0;
	visitDeclaredGenuiNodes(normalized.value, GENUI_LIMITS.maxNodes + 1, (node) => {
		if (node.type === "carousel" && Array.isArray(node.items)) carouselItemOverflow += Math.max(0, node.items.length - GENUI_LIMITS.maxCarouselItems);
		else if (node.type === "image-group" && Array.isArray(node.items)) imageGroupOverflow += Math.max(0, node.items.length - GENUI_LIMITS.maxImageGroupItems);
	});
	const truncationReasons = [];
	if (uncappedPolicyNodeCount > declaredNativeCount) truncationReasons.push(`${uncappedPolicyNodeCount - declaredNativeCount} 个声明节点超出 tabs ≤ ${GENUI_LIMITS.maxTabs} / accordion ≤ ${GENUI_LIMITS.maxAccordionItems} 的上限`);
	if (carouselItemOverflow > 0) truncationReasons.push(`${carouselItemOverflow} 个 carousel 项超出 carousel ≤ ${GENUI_LIMITS.maxCarouselItems} 的上限`);
	if (imageGroupOverflow > 0) truncationReasons.push(`${imageGroupOverflow} 张图片超出 image-group ≤ ${GENUI_LIMITS.maxImageGroupItems} 的上限`);
	if (repairCtx.truncatedTableRows > 0) truncationReasons.push(`${repairCtx.truncatedTableRows} 行超出 table.rows ≤ ${GENUI_LIMITS.maxTableRows} 的上限`);
	if (repairCtx.truncatedListItems > 0) truncationReasons.push(`${repairCtx.truncatedListItems} 项超出 list.items ≤ ${GENUI_LIMITS.maxListItems} 的上限`);
	if (repairCtx.truncatedFileTreeItems > 0) truncationReasons.push(`${repairCtx.truncatedFileTreeItems} 个节点超出 file-tree 每层 ≤ ${GENUI_LIMITS.maxListItems} 的上限`);
	if (truncationReasons.length > 0) warnings.push({
		kind: "truncated",
		path: "spec",
		message: `策略上限截断:${truncationReasons.join("；")},未渲染;策略限制包括 tabs ≤ ${GENUI_LIMITS.maxTabs} / accordion ≤ ${GENUI_LIMITS.maxAccordionItems} / carousel ≤ ${GENUI_LIMITS.maxCarouselItems} / image-group ≤ ${GENUI_LIMITS.maxImageGroupItems} / table.rows ≤ ${GENUI_LIMITS.maxTableRows} / list.items ≤ ${GENUI_LIMITS.maxListItems} / file-tree 每层 ≤ ${GENUI_LIMITS.maxListItems};围栏照常渲染,重发时可分为多个组件`
	});
	return {
		...options.deferPanelReferences === true ? { deferPanelReferences: true } : {},
		value: normalized.value,
		normalized: normalized.value,
		repaired,
		spec: repaired,
		errors: [...new Set(errors)],
		warnings,
		declaredCount: declaredNativeCount,
		renderedCount: renderedTotalCount,
		declaredNativeCount,
		renderedNativeCount,
		renderedTotalCount
	};
}
/** Return whether the only process errors describe an intentional budget tail cut. */
function isIntentionalBudgetCut(processed) {
	return processed.errors.length > 0 && processed.errors.every((error) => error.startsWith("spec exceeds ") || error.startsWith("repair dropped ")) && processed.renderedNativeCount === GENUI_LIMITS.maxNodes && processed.declaredNativeCount === GENUI_LIMITS.maxNodes + 1;
}
/** Decide whether a repaired spec is safe to expose to any GenUI renderer. */
function isRenderableProcess(processed) {
	return processed.spec !== null && (processed.errors.length === 0 || isIntentionalBudgetCut(processed));
}
/** Longest node or aligned table-detail slot path a validation error points at. */
const DECLARED_NODE_PATH_RE = /^(items\[\d+\](?:\.(?:items\[\d+\]|tabs\[\d+\]\.items\[\d+\]|details\[\d+\](?:\[\d+\])?))*)/;
function errorNodePath(error) {
	const match = DECLARED_NODE_PATH_RE.exec(error);
	return match === null ? null : match[1] ?? null;
}
/** Where the node or table-detail slot at a validation path lives. */
function nodeSlotAt(root, path) {
	const steps = [...path.matchAll(/(?:^|\.)(items|tabs|details)\[(\d+)\]|\[(\d+)\]/g)];
	if (steps.length === 0 || steps[steps.length - 1][1] === "tabs") return void 0;
	let current = root;
	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		const list = step[1] === void 0 ? current : obj(current)?.[step[1]];
		const index = Number(step[2] ?? step[3]);
		if (!Array.isArray(list) || index >= list.length) return void 0;
		if (i === steps.length - 1) return {
			array: list,
			index,
			preserveIndex: step[1] === "details"
		};
		current = list[index];
		if (current === void 0) return void 0;
	}
}
/** Deep-clone a JSON value for pruning; null when it cannot round-trip. */
function cloneJsonValue(value) {
	try {
		return obj(JSON.parse(JSON.stringify(value))) ?? null;
	} catch {
		return null;
	}
}
/**
* Best-effort repair for a spec whose strict validation failed: drop the
* declared nodes the errors point at and re-run the whole pipeline once.
*
* The fence channels call this after the strict gate refuses, so ONE bad
* component no longer degrades the whole fence to a code block — the
* behaviour the capability map documents ("坏节点静默丢弃…不会拖垮界面") and
* that validate_dsh_ui keeps diagnosing for the model. Bounded to a single
* retry: a second failing pass is a genuinely pathological tree and keeps
* today's full-fence fallback. Chart semantics stay protected the same way —
* an undrawable chart is DROPPED here, never repaired into a blank canvas.
*/
function partialRepairGenuiSpec(processed) {
	if (isRenderableProcess(processed)) return processed.spec;
	if (processed.spec === null) return null;
	const root = obj(processed.value);
	if (root === void 0) return null;
	const paths = /* @__PURE__ */ new Set();
	const overhangPaths = /* @__PURE__ */ new Set();
	for (const error of processed.errors) {
		if (error.startsWith("spec exceeds ")) continue;
		const nodePath = errorNodePath(error);
		if (nodePath === null) continue;
		if (error === `${nodePath}.details must not contain more entries than rows`) overhangPaths.add(nodePath);
		else paths.add(nodePath);
	}
	if (paths.size === 0 && overhangPaths.size === 0) return null;
	const pruned = cloneJsonValue(isComponentRoot(root) ? wrapSingleComponentRoot(root) : root);
	if (pruned === null) return null;
	const slots = [...paths].map((path) => nodeSlotAt(pruned, path)).filter((slot) => slot !== void 0);
	const overhangSlots = [...overhangPaths].map((path) => nodeSlotAt(pruned, path)).filter((slot) => slot !== void 0);
	for (const { array, index } of overhangSlots) {
		const table = obj(array[index]);
		if (table?.type === "table" && Array.isArray(table.details)) table.details.length = Math.min(table.details.length, tableRowsForDetails(table).length);
	}
	const byArray = /* @__PURE__ */ new Map();
	for (const { array, index, preserveIndex } of slots) {
		if (preserveIndex) {
			array[index] = null;
			continue;
		}
		const indexes = byArray.get(array);
		if (indexes === void 0) byArray.set(array, [index]);
		else indexes.push(index);
	}
	for (const [array, indexes] of byArray) {
		indexes.sort((a, b) => b - a);
		for (const index of indexes) array.splice(index, 1);
	}
	const retry = processGenuiSpec(pruned, { deferPanelReferences: processed.deferPanelReferences === true });
	if (!isRenderableProcess(retry) || retry.renderedNativeCount === 0) return null;
	return retry.spec;
}
/** 校验模板文字与图表、表格中的计算引用是否指向已声明字段。 */
function validateComputedReferences(title, items, computedIds, errors, allowExternalReferences = false) {
	const visited = /* @__PURE__ */ new WeakSet();
	let visitedCount = 0;
	const visit = (value, path, referenceAllowed, depth, templateAllowed = false, nodeScope = false) => {
		if (depth > GENUI_LIMITS.maxDepth * 2 || visitedCount >= GENUI_LIMITS.maxNodes * 8) return;
		if (typeof value === "string") {
			if (!templateAllowed) return;
			for (const match of value.matchAll(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g)) {
				const id = match[1];
				if (!allowExternalReferences && !computedIds.has(id)) errors.push(`${path} references unknown computed field '${id}'`);
			}
			return;
		}
		if (value === null || typeof value !== "object") return;
		if (nodeScope === false && !referenceAllowed && !templateAllowed) return;
		if (visited.has(value)) return;
		visited.add(value);
		visitedCount += 1;
		if (Array.isArray(value)) {
			value.forEach((item, index) => visit(item, `${path}[${index}]`, referenceAllowed, depth + 1, templateAllowed, nodeScope));
			return;
		}
		const record = value;
		const nodeType = nodeScope === true ? record.type : void 0;
		if (referenceAllowed && Object.keys(record).length === 1 && typeof record.$computed === "string") {
			if (!allowExternalReferences && !computedIds.has(record.$computed)) errors.push(`${path} references unknown computed field '${record.$computed}'`);
			return;
		}
		for (const [key, child] of Object.entries(record)) {
			const childAllowsReference = referenceAllowed || nodeType === "table" && key === "rows" || (nodeType === "chart" || nodeType === "echart") && (key === "data" || key === "series") || nodeType === "echart" && key === "option";
			visit(child, `${path}.${key}`, childAllowsReference, depth + 1, getComputedTemplateScope(nodeType, key, templateAllowed), getComputedChildNodeScope(nodeType, key, nodeScope));
		}
	};
	visit(title, "spec.title", false, 0, true);
	visit(items, "spec.items", false, 0, false, true);
}
function validateChartData(value, at, errors) {
	if (!Array.isArray(value)) return;
	for (let index = 0; index < value.length; index++) {
		const datum = obj(value[index]);
		const path = `${at}[${index}]`;
		if (datum === void 0) {
			errors.push(`${path} must be an object`);
			continue;
		}
		if (typeof datum.label !== "string") errors.push(`${path}.label must be a string`);
		if ((typeof datum.value !== "number" || !Number.isFinite(datum.value)) && repairComputedRef(datum.value) === void 0) errors.push(`${path}.value must be a finite number`);
		if (datum.color !== void 0 && typeof datum.color !== "string") errors.push(`${path}.color must be a string`);
	}
}
function validateChartSeries(value, at, errors) {
	if (!Array.isArray(value)) return;
	for (let index = 0; index < value.length; index++) {
		const series = obj(value[index]);
		const path = `${at}[${index}]`;
		if (series === void 0) {
			errors.push(`${path} must be an object`);
			continue;
		}
		if (typeof series.label !== "string") errors.push(`${path}.label must be a string`);
		if (series.color !== void 0 && typeof series.color !== "string") errors.push(`${path}.color must be a string`);
		if (!Array.isArray(series.data)) errors.push(`${path}.data must be an array`);
		validateChartData(series.data, `${path}.data`, errors);
	}
}
function validateChartNode(v, at, errors) {
	if (!Array.isArray(v.data) && !Array.isArray(v.series)) errors.push(`${at}: type 'chart' requires data or series (array)`);
	if (v.variant !== void 0) errors.push(`${at}.variant is unsupported; use kind`);
	if (v.data !== void 0 && !Array.isArray(v.data)) errors.push(`${at}.data must be an array`);
	if (v.series !== void 0 && !Array.isArray(v.series)) errors.push(`${at}.series must be an array`);
	if (v.kind !== void 0 && (typeof v.kind !== "string" || !CHART_KINDS.includes(v.kind))) errors.push(`${at}.kind must be bars, line, or donut`);
	const kind = v.kind === void 0 ? "bars" : v.kind;
	const series = Array.isArray(v.series) ? v.series : void 0;
	if (Array.isArray(v.data) && v.data.length === 0 && (series === void 0 || series.length === 0)) errors.push(`${at}.data must not be empty`);
	if (series !== void 0) {
		if (series.length === 0) errors.push(`${at}.series must not be empty`);
		if (kind === "donut") errors.push(`${at}.series is only supported for bars and line`);
		for (let index = 0; index < series.length; index++) {
			const entry = obj(series[index]);
			if (entry !== void 0 && Array.isArray(entry.data) && entry.data.length === 0) errors.push(`${at}.series[${index}].data must not be empty`);
		}
	}
	if (kind === "donut" && v.data === void 0) errors.push(`${at}.data is required for donut`);
	if (kind === "line" && v.data === void 0 && (series === void 0 || series.length === 0)) errors.push(`${at}.data is required for line (or provide series)`);
	validateChartData(v.data, `${at}.data`, errors);
	validateChartSeries(v.series, `${at}.series`, errors);
}
/** Validate table rows before repair can silently remove malformed cells. */
function validateTableRows(value, at, errors) {
	if (!Array.isArray(value)) return;
	for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
		const row = value[rowIndex];
		if (obj(row) !== void 0) continue;
		if (!Array.isArray(row)) {
			errors.push(`${at}[${rowIndex}] must be an array or object`);
			continue;
		}
		for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
			const cell = row[cellIndex];
			if (typeof cell !== "string" && (typeof cell !== "number" || !Number.isFinite(cell)) && repairComputedRef(cell) === void 0) errors.push(`${at}[${rowIndex}][${cellIndex}] must be a string or finite number`);
		}
	}
}
/** 按单日期或日期范围模式校验日期控件的数据。 */
function validateDatePicker(value, at, errors) {
	const mode = value.mode === "range" ? "range" : "single";
	const minimum = value.min;
	const maximum = value.max;
	if (minimum !== void 0 && !isIsoDate(minimum)) errors.push(`${at}.min must be a valid YYYY-MM-DD date`);
	if (maximum !== void 0 && !isIsoDate(maximum)) errors.push(`${at}.max must be a valid YYYY-MM-DD date`);
	if (isIsoDate(minimum) && isIsoDate(maximum) && minimum > maximum) errors.push(`${at}.min must not be after max`);
	if (value.value === void 0) return;
	const dates = mode === "range" && typeof value.value === "string" ? value.value.split("/") : [value.value];
	if (mode === "range" && dates.length !== 2) {
		errors.push(`${at}.value must contain start/end dates in range mode`);
		return;
	}
	if (!dates.every(isIsoDate)) {
		errors.push(`${at}.value must use valid YYYY-MM-DD dates`);
		return;
	}
	const dateValues = dates;
	const start = dateValues[0];
	const end = dateValues[1];
	if (end !== void 0 && start > end) errors.push(`${at}.value start date must not be after end date`);
	if (isIsoDate(minimum) && dateValues.some((date) => date < minimum)) errors.push(`${at}.value must not be before min`);
	if (isIsoDate(maximum) && dateValues.some((date) => date > maximum)) errors.push(`${at}.value must not be after max`);
	if (typeof value.value === "string" && !isDatePickerValueValid(value.value, mode, isIsoDate(minimum) ? minimum : void 0, isIsoDate(maximum) ? maximum : void 0)) errors.push(`${at}.value is outside the date-picker mode or range`);
}
function validateNode(value, depth, at, errors, walk) {
	if (depth > GENUI_LIMITS.maxDepth) {
		errors.push(`${at}: exceeds max depth ${GENUI_LIMITS.maxDepth}`);
		return;
	}
	const v = obj(value);
	if (v === void 0) {
		errors.push(`${at}: must be an object`);
		return;
	}
	const type = v.type;
	if (typeof type !== "string") {
		errors.push(`${at}: missing string 'type'`);
		return;
	}
	for (const key of ["when", "enableWhen"]) {
		if (v[key] === void 0) continue;
		const when = obj(v[key]);
		if (when === void 0) {
			errors.push(`${at}.${key}: must be an object`);
			continue;
		}
		if (typeof when.field !== "string" || when.field.trim() === "") errors.push(`${at}.${key}.field: requires a field id or group (string)`);
		if (enu(when.op, WHEN_OPS) === void 0) errors.push(`${at}.${key}.op: must be one of ${WHEN_OPS.join(" / ")}`);
		if ((when.op === "in" || when.op === "not-in") && !Array.isArray(when.value)) errors.push(`${at}.${key}.value: '${String(when.op)}' requires an array`);
	}
	const isStr = (name) => {
		if (v[name] !== void 0 && typeof v[name] !== "string") errors.push(`${at}: '${name}' must be a string`);
	};
	const isNum = (name) => {
		if (v[name] !== void 0 && (typeof v[name] !== "number" || !Number.isFinite(v[name]))) errors.push(`${at}: '${name}' must be a finite number`);
	};
	switch (type) {
		case "text":
			if (typeof v.content !== "string" && typeof v.text !== "string") errors.push(`${at}: type 'text' requires content or text (string)`);
			isStr("content");
			isStr("text");
			break;
		case "row":
		case "col":
		case "card":
		case "grid":
		case "carousel":
			if (!Array.isArray(v.items)) errors.push(`${at}: type '${type}' requires items (array)`);
			walk(type === "carousel" && Array.isArray(v.items) ? v.items.slice(0, GENUI_LIMITS.maxCarouselItems) : v.items, depth + 1, `${at}.items`);
			if (type === "grid") isNum("cols");
			break;
		case "button":
		case "checkbox":
		case "link":
		case "switch":
			if (typeof v.label !== "string") errors.push(`${at}: type '${type}' requires label (string)`);
			isStr("label");
			break;
		case "image-group":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'image-group' requires items (array)`);
			else v.items.slice(0, GENUI_LIMITS.maxImageGroupItems).forEach((item, index) => {
				const image = obj(item);
				if (image !== void 0 && typeof image.src === "string" && safeMediaSrc(image.src) === void 0) errors.push(`${at}.items[${index}].src must be an http(s) or relative media URL`);
			});
			break;
		case "choices":
			if (!Array.isArray(v.items) || v.items.length === 0) {
				errors.push(`${at}: type 'choices' requires items (non-empty array)`);
				break;
			}
			if (v.items.length > 8) errors.push(`${at}: 'choices' keeps at most 8 options`);
			if (typeof v.submit === "string" && v.submit.trim() !== "" && (typeof v.action !== "string" || v.action.trim() === "")) errors.push(`${at}: 'choices' with submit requires action — drop submit for a purely local selection`);
			v.items.slice(0, 8).forEach((item, index) => {
				const choice = obj(item);
				if (choice === void 0 || typeof choice.label !== "string" || choice.label.trim() === "") errors.push(`${at}.items[${index}]: requires label (string)`);
			});
			isStr("title");
			isStr("prompt");
			isStr("mode");
			isStr("submit");
			break;
		case "compare":
			for (const side of ["before", "after"]) {
				const panel = obj(v[side]);
				if (panel === void 0) {
					errors.push(`${at}: type 'compare' requires ${side} (object with src)`);
					continue;
				}
				if (typeof panel.src !== "string") errors.push(`${at}.${side}: requires src (string)`);
				else if (safeMediaSrc(panel.src) === void 0) errors.push(`${at}.${side}.src must be an http(s) or relative media URL`);
			}
			isStr("title");
			isStr("mode");
			break;
		case "image":
		case "audio":
		case "video":
			if (typeof v.src !== "string") errors.push(`${at}: type '${type}' requires src (string)`);
			isStr("src");
			isStr("alt");
			if (type === "video") isStr("poster");
			break;
		case "slider":
			isStr("label");
			isNum("min");
			isNum("max");
			isNum("step");
			isNum("value");
			break;
		case "date-picker":
			isStr("label");
			isStr("value");
			isStr("min");
			isStr("max");
			isStr("id");
			validateDatePicker(v, at, errors);
			break;
		case "segmented-control":
			isStr("label");
			isStr("value");
			isStr("id");
			isStr("action");
			if (!Array.isArray(v.options) || v.options.length === 0) errors.push(`${at}: type 'segmented-control' requires a non-empty options array`);
			else {
				if (v.options.length > GENUI_LIMITS.maxOptions) errors.push(`${at}: 'segmented-control' keeps at most ${GENUI_LIMITS.maxOptions} options`);
				if (v.options.some((option) => typeof option !== "string" || option.trim() === "")) errors.push(`${at}.options must contain non-empty strings`);
				if (typeof v.value === "string" && !v.options.includes(v.value)) errors.push(`${at}.value must match an option`);
				if (new Set(v.options).size !== v.options.length) errors.push(`${at}.options must be unique`);
			}
			break;
		case "input":
		case "textarea":
			isStr("label");
			isStr("placeholder");
			isStr("value");
			break;
		case "select":
		case "radio":
			if (!Array.isArray(v.options)) errors.push(`${at}: type '${type}' requires options (array)`);
			break;
		case "submit":
			if (typeof v.label !== "string") errors.push(`${at}: type 'submit' requires label (string)`);
			break;
		case "badge":
			if (typeof v.label !== "string" && typeof v.text !== "string" && typeof v.value !== "string") errors.push(`${at}: type 'badge' requires label, text, or value (string)`);
			isStr("label");
			isStr("text");
			isStr("value");
			break;
		case "hero":
			if (typeof v.title !== "string") errors.push(`${at}: type 'hero' requires title (string)`);
			isStr("subtitle");
			break;
		case "stat":
			if (typeof v.label !== "string") errors.push(`${at}: type 'stat' requires label (string)`);
			if (typeof v.value !== "string") errors.push(`${at}: type 'stat' requires value (string)`);
			isStr("delta");
			break;
		case "progress":
			if (typeof v.value !== "number" || !Number.isFinite(v.value) || v.value < 0 || v.value > 100) errors.push(`${at}: type 'progress' requires value (number 0..100)`);
			isNum("value");
			break;
		case "avatar":
			if (typeof v.name !== "string") errors.push(`${at}: type 'avatar' requires name (string)`);
			break;
		case "list":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'list' requires items (array)`);
			if (Array.isArray(v.items)) {
				let keptItems = 0;
				for (let i = 0; i < v.items.length; i++) {
					if (keptItems >= GENUI_LIMITS.maxListItems) break;
					const value = v.items[i];
					const item = obj(value);
					if (item !== void 0 && typeof item.type === "string") validateNode(item, depth + 1, `${at}.items[${i}]`, errors, walk);
					if (isRepairableListItem(value, depth + 1)) keptItems += 1;
				}
			}
			break;
		case "table":
			if (!Array.isArray(v.columns) && !hasDerivableTableColumns(v)) errors.push(`${at}: type 'table' requires columns (array)`);
			if (!Array.isArray(v.rows)) errors.push(`${at}: type 'table' requires rows (array)`);
			if (v.types !== void 0 && !Array.isArray(v.types)) errors.push(`${at}.types must be an array of column cell types`);
			if (v.details !== void 0 && !Array.isArray(v.details)) errors.push(`${at}.details must be an array aligned with rows`);
			if (Array.isArray(v.details)) {
				const table = {
					columns: v.columns,
					rows: v.rows,
					types: v.types
				};
				const rowCount = tableRowsForDetails(table).length;
				if (v.details.length > rowCount) errors.push(`${at}.details must not contain more entries than rows`);
				for (let i = 0; i < Math.min(v.details.length, rowCount); i++) {
					const detail = v.details[i];
					if (detail === null || !isTableDetailReachable(table, i)) continue;
					if (!Array.isArray(detail)) {
						errors.push(`${at}.details[${i}] must be an array or null`);
						continue;
					}
					walk(detail, depth + 1, `${at}.details[${i}]`);
				}
			}
			validateTableRows(v.rows, `${at}.rows`, errors);
			break;
		case "chart":
			validateChartNode(v, at, errors);
			break;
		case "tabs":
			if (!Array.isArray(v.tabs)) errors.push(`${at}: type 'tabs' requires tabs (array)`);
			if (Array.isArray(v.tabs)) for (let i = 0; i < v.tabs.length; i++) {
				const t = obj(v.tabs[i]);
				if (t === void 0) {
					errors.push(`${at}.tabs[${i}] must be an object`);
					continue;
				}
				if (typeof t.label !== "string") errors.push(`${at}.tabs[${i}].label must be a string`);
				walk(t.items, depth + 1, `${at}.tabs[${i}].items`);
			}
			break;
		case "plot":
			if (!Array.isArray(v.series)) errors.push(`${at}: type 'plot' requires series (array)`);
			break;
		case "callout":
			if (typeof v.content !== "string") errors.push(`${at}: type 'callout' requires content (string)`);
			break;
		case "steps":
			if (!Array.isArray(v.steps)) errors.push(`${at}: type 'steps' requires steps (array)`);
			break;
		case "keyvalue":
			if (!Array.isArray(v.pairs)) errors.push(`${at}: type 'keyvalue' requires pairs (array)`);
			break;
		case "diff":
			if (!Array.isArray(v.diffs)) errors.push(`${at}: type 'diff' requires diffs (array)`);
			break;
		case "divider":
		case "spacer": break;
		case "json":
			if (!("value" in v)) errors.push(`${at}: type 'json' requires value`);
			break;
		case "code":
			if (typeof v.code !== "string") errors.push(`${at}: type 'code' requires code (string)`);
			break;
		case "accordion":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'accordion' requires items (array)`);
			if (Array.isArray(v.items)) for (let i = 0; i < v.items.length; i++) {
				const item = obj(v.items[i]);
				if (item === void 0) {
					errors.push(`${at}.items[${i}] must be an object`);
					continue;
				}
				if (typeof item.title !== "string") errors.push(`${at}.items[${i}].title must be a string`);
				walk(item.items, depth + 1, `${at}.items[${i}].items`);
			}
			break;
		case "copy":
			if (typeof v.text !== "string") errors.push(`${at}: type 'copy' requires text (string)`);
			break;
		case "editor":
			if (typeof v.id !== "string" || typeof v.value !== "string") errors.push(`${at}: type 'editor' requires id and value (strings)`);
			else if (v.value.length > GENUI_LIMITS.maxEditorChars) errors.push(`${at}.value exceeds editor limit ${GENUI_LIMITS.maxEditorChars}`);
			break;
		case "entity-card":
			if (typeof v.name !== "string") errors.push(`${at}: type 'entity-card' requires name (string)`);
			break;
		case "popover":
			if (typeof v.label !== "string" || typeof v.content !== "string") errors.push(`${at}: type 'popover' requires label and content (strings)`);
			break;
		case "svg":
			if (typeof v.code !== "string") errors.push(`${at}: type 'svg' requires code (string)`);
			else if (v.code.length > GENUI_LIMITS.maxCode) errors.push(`${at}.code length ${v.code.length} exceeds SVG limit ${GENUI_LIMITS.maxCode}; simplify or split the SVG`);
			isNum("height");
			break;
		case "mermaid":
			if (typeof v.code !== "string") errors.push(`${at}: type 'mermaid' requires code (string)`);
			break;
		case "map":
			validateMap(v, at, errors);
			break;
		case "scene3d":
			if (!Array.isArray(v.meshes)) errors.push(`${at}: type 'scene3d' requires meshes (array)`);
			break;
		case "timeline":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'timeline' requires items (array)`);
			break;
		case "file-tree":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'file-tree' requires items (array)`);
			break;
		case "breadcrumb":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'breadcrumb' requires items (array)`);
			break;
		case "quiz":
			if (typeof v.question !== "string") errors.push(`${at}: type 'quiz' requires question (string)`);
			if (!Array.isArray(v.options)) errors.push(`${at}: type 'quiz' requires options (array)`);
			break;
		case "blocks":
			if (!Array.isArray(v.rows)) {
				errors.push(`${at}: type 'blocks' requires rows (array)`);
				break;
			}
			isNum("columns");
			v.rows.forEach((entry, i) => {
				const row = obj(entry);
				if (row === void 0) {
					errors.push(`${at}.rows[${i}] must be an object`);
					return;
				}
				if (!Array.isArray(row.cells)) {
					errors.push(`${at}.rows[${i}].cells must be an array`);
					return;
				}
				row.cells.forEach((cell, j) => {
					if (cell === null || typeof cell === "string") return;
					const holder = obj(cell);
					if (holder === void 0) {
						errors.push(`${at}.rows[${i}].cells[${j}] must be a string, null, or object`);
						return;
					}
					if (typeof holder.text !== "string") errors.push(`${at}.rows[${i}].cells[${j}].text must be a string`);
					if (holder.tone !== void 0 && !BLOCK_CELL_TONES.includes(holder.tone)) errors.push(`${at}.rows[${i}].cells[${j}].tone must be one of ${BLOCK_CELL_TONES.join(", ")}`);
					if (holder.color !== void 0 && color(holder.color) === void 0) errors.push(`${at}.rows[${i}].cells[${j}].color must be a literal colour or host token`);
				});
			});
			break;
		case "icon":
			if (typeof v.name !== "string") errors.push(`${at}: type 'icon' requires name (string)`);
			isNum("size");
			break;
		case "arrow": break;
		case "diagram":
			if (typeof v.kind !== "string") errors.push(`${at}: type 'diagram' requires kind (string)`);
			if (!Array.isArray(v.nodes)) errors.push(`${at}: type 'diagram' requires nodes (array)`);
			if (v.edges !== void 0 && !Array.isArray(v.edges)) errors.push(`${at}: type 'diagram' requires edges (array) when present`);
			break;
		case "echart":
			if (v.option === void 0 && v.data === void 0 && v.series === void 0 && (!Array.isArray(v.links) || v.links.length === 0)) errors.push(`${at}: type 'echart' requires option, data, series, or links`);
			isNum("height");
			break;
		default: if (!Object.hasOwn(COMPONENT_SCHEMAS, type)) {
			const lower = type.toLowerCase();
			const hint = GENUI_NATIVE_TYPES.has(lower) ? `; use '${lower}'` : "; use a type from COMPONENT_SCHEMAS";
			errors.push(`${at}: unknown type '${type}'${hint}`);
		}
	}
	const definition = getComponentSchema(type);
	if (definition !== void 0) validateRegistryFields(v, at, definition, errors);
}
//#endregion
//#region src/shared/fence-repair.ts
/**
* Tier-1 repair — SAFE AT ANY TIME (streaming included): heals the most
* common model JSON typos that do NOT change the body's structure, and only
* when the whole body parses afterwards (so a still-growing streaming half
* can never be adopted):
*
* 1. Unescaped half-width `"` inside a string value — Chinese text quoted
*    with ASCII quotes (e.g. `对"别名路径"判定失败`), which makes JSON.parse
*    fail near that quote with "Expected ',' or ']'...".
* 2. Trailing commas before `}` / `]` or at end of input.
* 3. Valueless object keys immediately before a complete key-and-colon pair.
* 4. CJK commas/colons in structural positions, never inside string content.
*
* A shared grammar-aware scan distinguishes object keys from values and
* checks the continuation after a potential string terminator. Ambiguous
* value quotes use bounded backtracking; trailing commas are dropped only
* outside strings.
*
* Returns `{ text, repairs }` on success, or null when nothing needed fixing
* or the body still does not parse (callers fall through to tier-2 / banner).
*/
function repairFenceJson(raw) {
	try {
		JSON.parse(raw);
		return null;
	} catch {}
	return scanFenceJson(raw, false);
}
/** A fixed search budget prevents quote ambiguity from becoming exponential. */
const MAX_QUOTE_ATTEMPTS = 32;
const MAX_QUOTE_LOOKAHEAD = 4096;
function isJsonSpace(ch) {
	return ch === " " || ch === "	" || ch === "\n" || ch === "\r";
}
/** Read punctuation at a structural boundary, including quote lookahead.
* String contents always use the original character, even when their quotes
* need repair; a separate quote-toggle normalization pass would corrupt them.
*/
function jsonStructureAt(raw, index) {
	const ch = raw[index] ?? "\0";
	if (ch === "：") return ":";
	if (ch === "，" || ch === "、" || ch === "；") return ",";
	return ch;
}
/** Skip only complete, valueless object keys followed by a valued member. */
function skipValuelessKeys(raw, start, limit = raw.length) {
	let cursor = start;
	let repairs = 0;
	while (cursor < limit && raw[cursor] === "\"") {
		const keyStart = cursor++;
		while (cursor < limit && raw[cursor] !== "\"") if (raw[cursor] === "\\") cursor += 2;
		else cursor++;
		if (cursor >= limit) return null;
		cursor++;
		try {
			JSON.parse(raw.slice(keyStart, cursor));
		} catch {
			return null;
		}
		while (cursor < limit && isJsonSpace(raw[cursor])) cursor++;
		if (jsonStructureAt(raw, cursor) === ":") return repairs > 0 ? {
			start: keyStart,
			repairs
		} : null;
		if (jsonStructureAt(raw, cursor) !== ",") return null;
		repairs++;
		cursor++;
		while (cursor < limit && isJsonSpace(raw[cursor])) cursor++;
	}
	return null;
}
/**
* Quote closure is contextual: only keys may be followed by `:`, and a comma
* must introduce the next member of the enclosing object/array. Walk closing
* delimiters too, so a bracket in a quoted code example cannot end a value
* when prose immediately follows it inside the enclosing JSON structure.
* Lookahead has a fixed bound; inconclusive long continuations keep the
* terminator interpretation and leave the final JSON.parse as the arbiter.
*/
function quoteCanClose(raw, index, key, scopes, complete) {
	const limit = Math.min(raw.length, index + MAX_QUOTE_LOOKAHEAD);
	let cursor = index + 1;
	const skipSpace = () => {
		while (cursor < limit && isJsonSpace(raw[cursor])) cursor++;
	};
	skipSpace();
	if (cursor >= limit) return true;
	if (key) return jsonStructureAt(raw, cursor) === ":";
	let scopeIndex = scopes.length - 1;
	if (jsonStructureAt(raw, cursor) === ":") return false;
	while (raw[cursor] === "}" || raw[cursor] === "]") {
		const scope = scopes[scopeIndex];
		if (scope === void 0) return false;
		if (raw[cursor] === scope.closer) scopeIndex--;
		else if (!complete) return false;
		cursor++;
		skipSpace();
		if (cursor >= limit) return true;
		if (scopeIndex < 0) return complete;
	}
	if (jsonStructureAt(raw, cursor) !== ",") return false;
	const scope = scopes[scopeIndex];
	if (scope === void 0) return false;
	cursor++;
	skipSpace();
	if (cursor >= limit) return true;
	if (raw[cursor] === scope.closer) return true;
	if (scope.closer === "]") return /["[{tfn\-0-9]/.test(raw[cursor]);
	if (raw[cursor] !== "\"") return false;
	const valueless = skipValuelessKeys(raw, cursor, limit);
	if (valueless !== null) cursor = valueless.start;
	cursor++;
	while (cursor < limit) {
		if (raw[cursor] === "\\") {
			cursor += 2;
			continue;
		}
		if (raw[cursor] === "\"") {
			cursor++;
			skipSpace();
			return cursor >= limit || jsonStructureAt(raw, cursor) === ":";
		}
		if (raw[cursor].charCodeAt(0) < 32) return false;
		cursor++;
	}
	return true;
}
/** Both tiers share the same string-aware scan and quote decisions. */
function scanFenceCandidate(raw, complete, contentQuotes) {
	let out = "";
	const scopes = [];
	let inString = false;
	let key = false;
	let interiorQuote = false;
	let escaped = false;
	let repairs = 0;
	let rootEnd = 0;
	let rawRootEnd = 0;
	let invalidValue = false;
	const choices = [];
	const finishValue = () => {
		const scope = scopes[scopes.length - 1];
		if (scope !== void 0) scope.expecting = "comma";
	};
	for (let i = 0; i < raw.length; i++) {
		let ch = raw[i];
		if (escaped) {
			if (inString && ch === "\"") interiorQuote = true;
			out += ch;
			escaped = false;
			continue;
		}
		if (inString) {
			if (ch === "\\") {
				out += ch;
				escaped = true;
				continue;
			}
			if (ch !== "\"") {
				out += ch;
				continue;
			}
			let next = i + 1;
			while (next < raw.length && isJsonSpace(raw[next])) next++;
			const ordinaryEnd = !key && (!interiorQuote && ",}]:".includes(raw[next] ?? "\0") || scopes[scopes.length - 1]?.closer === "]" && raw[next] === ",");
			if (!contentQuotes.has(i) && (ordinaryEnd || quoteCanClose(raw, i, key, scopes, complete))) {
				inString = false;
				out += ch;
				const scope = scopes[scopes.length - 1];
				if (key) {
					if (scope !== void 0) scope.expecting = "colon";
				} else {
					finishValue();
					if (scope !== void 0 && interiorQuote) {
						if (choices.length === MAX_QUOTE_ATTEMPTS) choices.shift();
						choices.push(i);
					}
				}
			} else {
				out += "\\\"";
				interiorQuote = true;
				repairs++;
			}
			continue;
		}
		const structural = jsonStructureAt(raw, i);
		if (structural !== ch) {
			ch = structural;
			repairs++;
		}
		if (ch === "\"") {
			key = scopes[scopes.length - 1]?.expecting === "key";
			if (key) {
				const valueless = skipValuelessKeys(raw, i);
				if (valueless !== null) {
					repairs += valueless.repairs;
					i = valueless.start - 1;
					continue;
				}
			}
			interiorQuote = false;
			inString = true;
			out += ch;
			continue;
		}
		if (ch === "{" || ch === "[") {
			finishValue();
			scopes.push({
				closer: ch === "{" ? "}" : "]",
				expecting: ch === "{" ? "key" : "value"
			});
			out += ch;
			continue;
		}
		if (ch === "}" || ch === "]") {
			if (scopes[scopes.length - 1]?.closer === ch) {
				scopes.pop();
				out += ch;
				if (scopes.length === 0 && rootEnd === 0) {
					rootEnd = out.length;
					rawRootEnd = i + 1;
				}
			} else if (complete) repairs++;
			else out += ch;
			continue;
		}
		if (ch === ",") {
			let j = i + 1;
			while (j < raw.length && isJsonSpace(raw[j])) j++;
			if (j === raw.length || raw[j] === "}" || raw[j] === "]") {
				repairs++;
				continue;
			}
			const scope = scopes[scopes.length - 1];
			if (scope !== void 0) scope.expecting = scope.closer === "}" ? "key" : "value";
		} else if (ch === ":") {
			const scope = scopes[scopes.length - 1];
			if (scope !== void 0) scope.expecting = "value";
		} else if (!isJsonSpace(ch) && scopes[scopes.length - 1]?.expecting === "value") {
			let j = i + 1;
			while (j < raw.length && !isJsonSpace(raw[j]) && !"{}[],:\"".includes(jsonStructureAt(raw, j))) j++;
			const token = raw.slice(i, j);
			if (!/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)$/.test(token)) invalidValue = true;
			finishValue();
			out += token;
			i = j - 1;
			continue;
		}
		out += ch;
	}
	const unfinishedString = inString;
	if (complete) {
		if (inString) {
			out += "\"";
			repairs++;
		}
		while (scopes.length > 0) {
			out += scopes.pop().closer;
			repairs++;
		}
	}
	return {
		text: out,
		repairs,
		rootEnd,
		rawRootEnd,
		choices,
		unfinishedString,
		invalidValue
	};
}
/** Find an authoritative, already-valid object/array prefix without repair. */
function originalJsonPrefix(raw) {
	const scopes = [];
	let inString = false;
	let escaped = false;
	let started = false;
	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (inString) {
			if (ch === "\\") escaped = true;
			else if (ch === "\"") inString = false;
			continue;
		}
		if (!started) {
			if (isJsonSpace(ch)) continue;
			if (ch !== "{" && ch !== "[") return null;
			started = true;
		}
		if (ch === "\"") {
			inString = true;
			continue;
		}
		if (ch === "{" || ch === "[") scopes.push(ch === "{" ? "}" : "]");
		else if (ch === "}" || ch === "]") {
			if (scopes.pop() !== ch) return null;
			if (scopes.length === 0) {
				const text = raw.slice(0, i + 1).trimEnd();
				try {
					JSON.parse(text);
					return text;
				} catch {
					return null;
				}
			}
		}
	}
	return null;
}
/**
* Prefer real terminators; if the resulting whole body fails, try interpreting
* a bounded number of ambiguous value quotes as content. Each attempt is an
* iterative scan, not a recursive parser; no engine-specific error offset is
* needed. Fixed attempts/lookahead give O(n) time and O(n) working storage.
*/
function scanFenceJson(raw, complete) {
	const original = originalJsonPrefix(raw);
	if (original !== null) return complete ? {
		text: original,
		repairs: 1
	} : null;
	const pending = [[]];
	let prefix = null;
	for (let attempt = 0; attempt < MAX_QUOTE_ATTEMPTS && pending.length > 0; attempt++) {
		const forced = pending.pop();
		const scanned = scanFenceCandidate(raw, complete, new Set(forced));
		if (scanned.repairs > 0 && !(forced.length > 0 && scanned.unfinishedString)) try {
			JSON.parse(scanned.text);
			return {
				text: scanned.text,
				repairs: scanned.repairs
			};
		} catch {}
		if (complete && scanned.rootEnd > 0 && (prefix === null || scanned.rawRootEnd > prefix.rawEnd)) {
			const text = scanned.text.slice(0, scanned.rootEnd).trimEnd();
			try {
				JSON.parse(text);
				prefix = {
					text,
					repairs: scanned.repairs + 1,
					rawEnd: scanned.rawRootEnd
				};
			} catch {}
		}
		if (scanned.invalidValue) continue;
		const last = forced[forced.length - 1] ?? -1;
		for (const quote of scanned.choices) if (quote > last) pending.push([...forced, quote]);
		if (pending.length > MAX_QUOTE_ATTEMPTS) pending.splice(0, pending.length - MAX_QUOTE_ATTEMPTS);
	}
	if (prefix !== null) return {
		text: prefix.text,
		repairs: prefix.repairs
	};
	return null;
}
/**
* Tier-3 shape rewrite — a member KEY written as a one-element ARRAY:
*
*     {"type":"table",["columns"]:["a","b"],"rows":[["1","2"]]}
*
* Every bracket is still balanced and the quotes are all well-formed, so
* neither the quote/trailing-comma tier nor the closer-appending scan can see
* anything wrong: the first tier parses nothing, the second finds nothing to
* append. Only the GRAMMAR is wrong — a string sits where a key belongs.
*
* The key is recoverable because the wrapped string is a complete, already
* string-escaped JSON string: unwrap it in place (`["k"]` → `"k"`) and the
* member becomes legal. The rewrite is a pure splice of one string token, so
* it cannot invent content. Safe by construction: only applied to a body that
* does not parse, and the caller adopts the result only when the rewrite plus
* the remaining tiers produce a WHOLE body that parses.
*
* @param raw - the raw fence body.
* @returns the unwrapped body plus the edit count, or null when no key is
*   written that way.
*/
function repairWrappedMemberKey(raw) {
	if (!/\[\s*"/.test(raw)) return null;
	const tokens = [];
	let inString = false;
	let escaped = false;
	let stringStart = -1;
	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i];
		if (inString) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (ch === "\\") {
				escaped = true;
				continue;
			}
			if (ch === "\"") {
				inString = false;
				tokens.push({
					kind: "string",
					start: stringStart,
					end: i + 1
				});
			}
			continue;
		}
		if (ch === "\"") {
			inString = true;
			stringStart = i;
			continue;
		}
		if (ch === "{" || ch === "}" || ch === "[" || ch === "]" || ch === "," || ch === ":") tokens.push({
			kind: ch,
			start: i,
			end: i + 1
		});
	}
	const enclosingOf = [];
	const openStack = [];
	for (const token of tokens) {
		if (token.kind === "}" || token.kind === "]") {
			enclosingOf.push(openStack.pop() ?? null);
			continue;
		}
		enclosingOf.push(openStack[openStack.length - 1] ?? null);
		if (token.kind === "{" || token.kind === "[") openStack.push(token.kind);
	}
	const unwraps = [];
	for (let k = 0; k + 2 < tokens.length; k++) {
		const open = tokens[k];
		const key = tokens[k + 1];
		const close = tokens[k + 2];
		if (open.kind !== "[" || key.kind !== "string" || close.kind !== "]") continue;
		if (raw.slice(open.end, key.start).trim() !== "") continue;
		if (raw.slice(key.end, close.start).trim() !== "") continue;
		const prev = tokens[k - 1];
		if (prev === void 0) continue;
		if (prev.kind !== "{" && prev.kind !== ",") continue;
		if (enclosingOf[k] !== "{") continue;
		const next = tokens[k + 3];
		if (next === void 0 || next.kind !== ":") continue;
		unwraps.push({
			from: open.start,
			to: close.end,
			key: raw.slice(key.start, key.end)
		});
		k += 2;
	}
	if (unwraps.length === 0) return null;
	let text = "";
	let cursor = 0;
	for (const edit of unwraps) {
		text += raw.slice(cursor, edit.from) + edit.key;
		cursor = edit.to;
	}
	text += raw.slice(cursor);
	return {
		text,
		repairs: unwraps.length
	};
}
/**
* Apply every shape rewrite that matches, in a fixed order, so a body that
* carries several balanced-but-wrong shapes is healed in one pass.
*
* THE ORDER IS LOAD-BEARING — wrapped keys must be unwrapped FIRST. On
* `{"columns":["a"],["rows"]:[["1"]]}` (a wrapped `rows` KEY whose value
* is the matrix) the Tetris rewrite alone claims the sibling `[…]` as a bare
* row matrix and splices it into `"rows": ["rows"]:[["1"]]]`, destroying the
* only recoverable path; unwrapping first leaves a real `"rows":` key that
* Tetris no longer matches. Verified: forward heals (repairs=1), reversed
* returns null, and a regression test pins that order by that exact literal.
*
* (Note the colon: WITHOUT it the two rewrites do not collide, because Tetris
* then takes its keyed branch and both orders agree.)
*
* @param raw - the raw fence body.
* @returns the rewritten body plus the total edit count, or null when no
*   shape rewrite applies.
*/
function rewriteFenceShapes(raw) {
	let text = raw;
	let repairs = 0;
	const wrapped = repairWrappedMemberKey(text);
	if (wrapped !== null) {
		text = wrapped.text;
		repairs += wrapped.repairs;
	}
	const tetris = rewriteTetrisTableColumns(text);
	if (tetris !== null) {
		text = tetris.text;
		repairs += tetris.repairs;
	}
	return repairs === 0 ? null : {
		text,
		repairs
	};
}
/**
* Rewrite the "Tetris table" shape into legal JSON: the model closed the
* `columns` array after the header cells and then wrote the row matrix as a
* SIBLING array element —
*
*     "columns":["a","b"],["rows":[["1","2"],["3","4"]]]
*
* The element after `columns` is a `rows` field wearing the wrong hat, so
* restore the key (`"rows":[…]`) and drop the closer the mis-nesting left
* over (the final bracket-depth rescan removes every unmatched closer). Safe
* by construction: only applied to a body that does not parse, and the caller
* adopts the result only when the WHOLE body then parses.
*
* @param raw - the raw fence body.
* @returns the rewritten body plus the edit count, or null when the shape is
*   not present (or the columns array never closes).
*/
function rewriteTetrisTableColumns(raw) {
	if (!/"columns"\s*:\s*\[/.test(raw)) return null;
	let text = "";
	let rest = raw;
	let edits = 0;
	while (true) {
		const match = /"columns"\s*:\s*\[/.exec(rest);
		if (match === null) {
			text += rest;
			break;
		}
		const start = match.index + match[0].length;
		let depth = 1;
		let inString = false;
		let escaped = false;
		let end = -1;
		for (let i = start; i < rest.length; i++) {
			const ch = rest[i];
			if (escaped) {
				escaped = false;
				continue;
			}
			if (inString) {
				if (ch === "\\") escaped = true;
				else if (ch === "\"") inString = false;
				continue;
			}
			if (ch === "\"") {
				inString = true;
				continue;
			}
			if (ch === "[") depth++;
			else if (ch === "]") {
				depth--;
				if (depth === 0) {
					end = i;
					break;
				}
			}
		}
		if (end < 0) return null;
		const after = rest.slice(end + 1);
		const keyed = /^\s*,\s*\[\s*"rows"\s*:\s*\[/.exec(after);
		if (keyed !== null) {
			const through = end + 1 + keyed[0].length;
			text += `${rest.slice(0, end + 1)},"rows":[`;
			rest = rest.slice(through);
			edits += 1;
			continue;
		}
		const nextArray = /^\s*,\s*\[/.exec(after);
		if (nextArray === null) {
			text += rest.slice(0, end + 1);
			rest = after;
			continue;
		}
		const throughBracket = end + 1 + nextArray[0].length;
		text += rest.slice(0, throughBracket).replace(/,\s*\[$/, ", \"rows\": [");
		rest = rest.slice(throughBracket);
		edits += 1;
	}
	if (edits === 0) return null;
	const stack = [];
	let out = "";
	let inString = false;
	let escaped = false;
	for (const ch of text) {
		if (escaped) {
			out += ch;
			escaped = false;
			continue;
		}
		if (inString) {
			out += ch;
			if (ch === "\\") escaped = true;
			else if (ch === "\"") inString = false;
			continue;
		}
		if (ch === "\"") {
			inString = true;
			out += ch;
			continue;
		}
		if (ch === "{" || ch === "[") {
			stack.push(ch);
			out += ch;
			continue;
		}
		if (ch === "}" || ch === "]") {
			const open = stack[stack.length - 1];
			if (ch === "}" && open === "{" || ch === "]" && open === "[") {
				stack.pop();
				out += ch;
			} else edits += 1;
			continue;
		}
		out += ch;
	}
	return {
		text: out,
		repairs: edits
	};
}
/**
* Tier-2 repair — SETTLED MESSAGES ONLY (never while streaming): heals
* structural incompleteness — missing closing quotes/brackets — by appending
* the missing terminators, and heals stray closers — a `]` mistyped as `}` or
* a duplicated terminator — by skipping closers that do not match the open
* stack (they cannot be legal JSON). Callers gate it on settled messages (the
* client uses the host-provided fence source; the validate tool is by
* definition pre-emission), so a streaming half can never flash premature UI.
*
* One shared scan implementation folds the tier-1 fixes (quote escaping +
* trailing-comma drops) into structural completion, so bodies with BOTH defects
* (a trailing comma AND a missing closer) heal in one shot — the old
* two-phase chain lost tier-1's partial work when its whole-body parse
* failed, and re-scanning the raw text could not compose the repairs.
* Adopted only when the completed body parses as whole JSON.
*/
function completeFenceJson(raw) {
	try {
		JSON.parse(raw);
		return null;
	} catch {}
	const shaped = rewriteFenceShapes(raw);
	if (shaped !== null) {
		try {
			JSON.parse(shaped.text);
			return shaped;
		} catch {}
		const scanned = completeFenceJson(shaped.text);
		if (scanned === null) return null;
		return {
			text: scanned.text,
			repairs: scanned.repairs + shaped.repairs
		};
	}
	return scanFenceJson(raw, true);
}
//#endregion
//#region src/plugin/genui-diagnostic.ts
/** 获取指定组件类型已知字段，保持提示顺序稳定。 */
function knownFieldsOf(type) {
	const schema = COMPONENT_SCHEMAS[type];
	if (schema === void 0) return [];
	return [...schema.required, ...Object.keys(schema.optional)];
}
/** 获取校验错误对应的节点路径。 */
function nodePathOf(error) {
	const match = /^(items\[\d+\](?:\.items\[\d+\])*)(?=:|\.items\[|$)/.exec(error);
	return match === null ? null : match[1];
}
/** 根据节点路径读取模型声明的节点对象。 */
function declaredNodeAt(value, path) {
	if (typeof value !== "object" || value === null) return void 0;
	const root = value;
	const normalized = path.replace(/^items/, "");
	let current = normalized === "" ? root : root.items;
	for (const step of normalized.replace(/^\./, "").split(".").filter((part) => part !== "")) {
		const matched = /(?:items)?\[(\d+)\]/.exec(step);
		const index = matched === null ? NaN : Number(matched[1]);
		if (!Number.isInteger(index) || !Array.isArray(current)) return void 0;
		current = current[index];
	}
	return typeof current === "object" && current !== null && !Array.isArray(current) ? current : void 0;
}
/** 将校验错误转换为固定协议字段。 */
function fieldSymptom(error, path, type) {
	const rest = error.slice(path.length);
	const unknown = /^\.([A-Za-z0-9_-]+): unknown field\b/.exec(rest);
	if (unknown !== null) {
		const known = knownFieldsOf(type);
		return [
			`error=unknown_field`,
			`field=${unknown[1]}`,
			...known.length === 0 ? [] : [`allowed=${known.join(",")}`]
		].join("\n");
	}
	const missing = /requires ([A-Za-z0-9_-]+)/.exec(rest);
	if (missing !== null) return `error=missing_required_field\nfield=${missing[1]}`;
	return `error=validation_error\ndetail=${JSON.stringify(rest.replace(/^:\s*/, "").slice(0, 120))}`;
}
/** 获取校验错误中声明的组件类型。 */
function errorTypeOf(error) {
	return /type '([^']+)'/.exec(error)?.[1];
}
/** 生成被丢弃节点的路径、类型和字段诊断。 */
function droppedNodeDiagnosis(processed, raw) {
	const byPath = /* @__PURE__ */ new Map();
	for (const error of processed.errors) {
		const path = nodePathOf(error);
		if (path === null) continue;
		const bucket = byPath.get(path);
		if (bucket === void 0) byPath.set(path, [error]);
		else bucket.push(error);
	}
	const lines = [];
	for (const [path, errors] of byPath) {
		const node = declaredNodeAt(raw, path);
		const type = (typeof node?.type === "string" ? node.type : void 0) ?? errors.map(errorTypeOf).find((candidate) => candidate !== void 0);
		if (type !== void 0 && repairedContainsType(processed.repaired, type)) continue;
		const emitted = node === void 0 ? [] : Object.keys(node).filter((key) => key !== "type");
		const symptoms = [...new Set(errors.map((error) => fieldSymptom(error, path, type ?? "unknown")))];
		lines.push([
			`node=${path}`,
			`type=${type ?? "unknown"}`,
			...symptoms,
			...emitted.length === 0 ? [] : [`written=${emitted.join(",")}`]
		].join("\n"));
	}
	return lines;
}
/** 检查修复后的组件树中是否仍然存在指定类型的原生节点。 */
function repairedContainsType(node, type) {
	if (Array.isArray(node)) return node.some((child) => repairedContainsType(child, type));
	if (typeof node !== "object" || node === null) return false;
	const record = node;
	if (record.type === type) return true;
	return Object.values(record).some((child) => repairedContainsType(child, type));
}
/**
* 报告被丢弃的组件，并保留模型可以直接修正的字段信息。
*
* @param processed - 节点处理结果。
* @param raw - 节点处理使用的原始值。
* @returns 可嵌入调用方协议的诊断字段；没有节点被丢弃时返回 undefined。
*/
function droppedNodeFailure(processed, raw) {
	if (!processed.errors.some((error) => error.startsWith("repair dropped "))) return void 0;
	const dropped = processed.declaredNativeCount - processed.renderedNativeCount;
	const diagnosis = droppedNodeDiagnosis(processed, raw);
	return [
		`declared=${processed.declaredNativeCount}`,
		`rendered=${processed.renderedNativeCount}`,
		`dropped=${dropped}`,
		...diagnosis.flatMap((line) => [line, ""]),
		...processed.errors.map((error) => `diagnostic=${JSON.stringify(error)}`)
	];
}
//#endregion
//#region src/plugin/inline-content-diagnostic.ts
/** 识别文字字段中的连续代码围栏标记。 */
function hasFencedCode(value) {
	return /`{3,}|~{3,}/.test(value);
}
/** 判断相邻表头下方的 Markdown 表格分隔行。 */
function isMarkdownTableSeparator(line) {
	let value = line.trim();
	if (value.startsWith("|")) value = value.slice(1);
	if (value.endsWith("|")) value = value.slice(0, -1);
	const cells = value.split("|").map((cell) => cell.trim());
	return cells.length >= 2 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}
/** 仅在相邻表头和分隔行构成表格时报告。 */
function hasMarkdownTable(value) {
	const lines = value.split(/\r?\n/);
	for (let i = 0; i + 1 < lines.length; i++) if (lines[i].includes("|") && isMarkdownTableSeparator(lines[i + 1])) return true;
	return false;
}
/** 按组件结构检查需要块级内容诊断的 canonical 显示字段。 */
function collectInlineContentWarnings(spec) {
	const warnings = [];
	/** 将一个可见文字字段中的块级 Markdown 记录为稳定诊断。 */
	function check(value, path) {
		if (value === void 0) return;
		if (hasFencedCode(value)) warnings.push({
			path,
			kind: "fenced_code",
			replacement: "code"
		});
		if (hasMarkdownTable(value)) warnings.push({
			path,
			kind: "markdown_table",
			replacement: "table"
		});
	}
	/** 只沿 GenUI 组件的子节点字段访问下一层。 */
	function visit(node, path) {
		switch (node.type) {
			case "text":
				check(node.content, `${path}.content`);
				break;
			case "card":
				check(node.title, `${path}.title`);
				node.items.forEach((child, i) => visit(child, `${path}.items[${i}]`));
				break;
			case "carousel":
				check(node.title, `${path}.title`);
				node.items.slice(0, GENUI_LIMITS.maxCarouselItems).forEach((child, i) => visit(child, `${path}.items[${i}]`));
				break;
			case "image-group":
				check(node.title, `${path}.title`);
				node.items.slice(0, GENUI_LIMITS.maxImageGroupItems).forEach((item, i) => check(item.caption, `${path}.items[${i}].caption`));
				break;
			case "row":
			case "col":
			case "grid":
				node.items.forEach((child, i) => visit(child, `${path}.items[${i}]`));
				break;
			case "button":
			case "checkbox":
			case "link":
			case "badge":
			case "switch":
			case "submit":
				check(node.label, `${path}.label`);
				break;
			case "input":
			case "select":
			case "slider":
			case "textarea":
				check(node.label, `${path}.label`);
				break;
			case "radio":
				check(node.label, `${path}.label`);
				node.options.forEach((option, i) => check(option, `${path}.options[${i}]`));
				if (typeof node.answer === "string") check(node.answer, `${path}.answer`);
				check(node.explanation, `${path}.explanation`);
				break;
			case "image":
			case "audio":
			case "video":
				check(node.alt, `${path}.alt`);
				break;
			case "hero":
				for (const field of [
					"label",
					"value",
					"delta",
					"title",
					"subtitle"
				]) check(node[field], `${path}.${field}`);
				break;
			case "stat":
				for (const field of [
					"label",
					"value",
					"delta"
				]) check(node[field], `${path}.${field}`);
				break;
			case "progress":
				check(node.label, `${path}.label`);
				check(node.valueLabel, `${path}.valueLabel`);
				break;
			case "list":
				node.items.forEach((item, i) => {
					const itemPath = `${path}.items[${i}]`;
					if (typeof item === "string") check(item, itemPath);
					else if ("type" in item && typeof item.type === "string") visit(item, itemPath);
					else {
						check(item.title, `${itemPath}.title`);
						check(item.desc, `${itemPath}.desc`);
					}
				});
				break;
			case "table":
				node.columns.forEach((column, i) => check(column, `${path}.columns[${i}]`));
				node.rows.forEach((row, i) => {
					const detail = node.details?.[i] ?? null;
					row.forEach((cell, j) => {
						if (node.types?.[j] === "index" && (j !== 0 || detail === null)) return;
						if (typeof cell === "string") check(cell, `${path}.rows[${i}][${j}]`);
					});
				});
				node.details?.forEach((detail, i) => detail?.forEach((child, j) => visit(child, `${path}.details[${i}][${j}]`)));
				break;
			case "chart":
				node.series?.forEach((series, i) => check(series.label, `${path}.series[${i}].label`));
				break;
			case "tabs":
				node.tabs.forEach((tab, i) => {
					check(tab.label, `${path}.tabs[${i}].label`);
					tab.items.forEach((child, j) => visit(child, `${path}.tabs[${i}].items[${j}]`));
				});
				break;
			case "accordion":
				node.items.forEach((item, i) => {
					check(item.title, `${path}.items[${i}].title`);
					item.items.forEach((child, j) => visit(child, `${path}.items[${i}].items[${j}]`));
				});
				break;
			case "callout":
				check(node.title, `${path}.title`);
				check(node.content, `${path}.content`);
				break;
			case "steps":
				node.steps.forEach((step, i) => {
					check(step.title, `${path}.steps[${i}].title`);
					check(step.desc, `${path}.steps[${i}].desc`);
				});
				break;
			case "keyvalue":
				node.pairs.forEach((pair, i) => {
					check(pair.key, `${path}.pairs[${i}].key`);
					check(pair.value, `${path}.pairs[${i}].value`);
				});
				break;
			case "timeline":
				node.items.forEach((item, i) => {
					check(item.title, `${path}.items[${i}].title`);
					check(item.time, `${path}.items[${i}].time`);
					check(item.desc, `${path}.items[${i}].desc`);
				});
				break;
			case "breadcrumb":
				node.items.forEach((item, i) => check(item, `${path}.items[${i}]`));
				break;
			case "quiz":
				check(node.question, `${path}.question`);
				node.options.forEach((option, i) => {
					check(option.label, `${path}.options[${i}].label`);
					check(option.feedback, `${path}.options[${i}].feedback`);
				});
				check(node.explanation, `${path}.explanation`);
				break;
			case "plot":
			case "echart":
			case "diagram":
			case "scene3d":
			case "svg":
				check(node.title, `${path}.title`);
				break;
			case "copy": check(node.label, `${path}.label`);
		}
	}
	check(spec.title, "title");
	spec.items.forEach((node, i) => visit(node, `items[${i}]`));
	return warnings;
}
//#endregion
//#region src/client/table-export.ts
/** Display the same computed value in the table and in its exports. */
function tableCellText(value) {
	if (value !== null && typeof value === "object" && Object.hasOwn(value, GENUI_COMPUTED_CELL)) return value.formatted;
	return String(value ?? "");
}
/** Markdown table text for the copy action (pipes escaped). */
function tableToMarkdown(columns, rows) {
	const escape = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
	return [
		`| ${columns.map(escape).join(" | ")} |`,
		`| ${columns.map(() => "---").join(" | ")} |`,
		...rows.map((row) => `| ${columns.map((_c, i) => escape(tableCellText(row[i]))).join(" | ")} |`)
	].join("\n");
}
/** CSV text for the copy action, with the web renderer's existing escaping. */
function tableToCsv(rows) {
	const cell = (v) => {
		const s = tableCellText(v);
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
	};
	return rows.map((row) => row.map(cell).join(",")).join("\n");
}
//#endregion
//#region src/plugin/dsh-go-submission.ts
/** One submission snapshot shared by native rendering and dispatch. */
function nativeSubmission(spec, state, groups) {
	const registry = compileSubmissionRegistry(resolveComputedSpec(spec, evaluateComputed(spec, state.fields)));
	const answers = Object.create(null), fields = Object.create(null);
	for (const member of registry.members.values()) {
		const value = state.fields[member.key];
		if (member.kind === "radio" && value !== void 0) answers[member.key] = value;
		if (member.kind === "field" && !member.secret && value !== void 0 && value.trim() !== "") fields[member.key] = value;
	}
	const multiAnswers = Object.fromEntries(Object.entries(state.choices).flatMap(([key, values]) => {
		const member = registry.members.get(key);
		return member?.kind === "checkbox" ? [[key, values.filter((v) => member.choices.has(v))]] : [];
	}));
	const collectedAnswers = {
		...answers,
		...Object.fromEntries(Object.entries(multiAnswers).map(([key, values]) => {
			const member = registry.members.get(key);
			return [key, values.map((value) => member?.kind === "checkbox" ? member.choices.get(value) : value)];
		}))
	};
	return {
		registry,
		resolved: resolveSubmitState({
			registry,
			...groups ? { groups } : {},
			state: {
				answers,
				fields,
				multiAnswers,
				secretFields: /* @__PURE__ */ new Set()
			}
		}),
		answers,
		fields,
		collectedAnswers
	};
}
//#endregion
//#region src/plugin/dsh-go-types.ts
function emptyNativeState() {
	return {
		fields: Object.create(null),
		choices: Object.create(null),
		tabs: Object.create(null),
		feedback: Object.create(null)
	};
}
//#endregion
//#region src/plugin/dsh-go-compiler.ts
const nativeIdentity = (spec) => createHash("sha256").update(JSON.stringify(spec)).digest("hex").slice(0, 24);
const text = (value) => ({
	type: "text",
	text: value
});
const stack = (children) => ({
	type: "stack",
	children
});
const tone = (value) => ({
	success: "good",
	warning: "warn",
	error: "bad",
	danger: "bad"
})[value ?? ""] ?? value;
/** Keep full grading feedback within the App's 2000 UTF-16 units per text node. */
function feedbackBlocks(value) {
	const parts = [];
	let start = 0;
	while (start < value.length) {
		let end = Math.min(start + 2e3, value.length);
		if (end < value.length && /[\uD800-\uDBFF]/u.test(value[end - 1])) end--;
		parts.push({
			type: "callout",
			tone: "info",
			text: value.slice(start, end)
		});
		start = end;
	}
	return parts;
}
/** The original web spec stays authoritative; native limitations are visible. */
function compileDshGo(spec, surface, state = emptyNativeState(), locale = "zh", generation) {
	const identity = generation ?? nativeIdentity(spec), actions = /* @__PURE__ */ new Map(), issues = [];
	const en = locale.startsWith("en");
	const unsupported = (key, reason) => {
		issues.push(`${key}: ${reason}`);
		return {
			type: "callout",
			tone: "warn",
			text: en ? `Unavailable in the native view: ${reason}` : `原生界面暂不支持：${reason}`
		};
	};
	const action = (node, key, kind) => {
		const id = `g${identity}.${key}${kind ? `.${kind}` : ""}`;
		actions.set(id, {
			node,
			key,
			...kind ? { kind } : {}
		});
		return id;
	};
	const panelOnly = (key) => unsupported(key, en ? "use the GenUI native panel for this interaction" : "此交互请打开 GenUI 原生面板");
	const labeled = (label, body) => label ? stack([text(label), body]) : body;
	const choices = (item, key, labels, selected = []) => {
		if (labels.length > 8 || new Set(labels).size !== labels.length || labels.some((l) => l.length > 80 || /[\r\n]/u.test(l))) return unsupported(key, "options labels/limit");
		if (surface === "tool" || surface === "fence" && labels.some((l) => l.includes("、"))) return panelOnly(key);
		return {
			type: "options",
			id: surface === "panel" ? action(item, key) : key,
			options: labels.map((label) => ({
				label,
				value: label
			})),
			...surface === "panel" ? { selected } : {}
		};
	};
	const children = (items, key) => items.map((item, i) => node(item, `${key}.${i}`));
	const node = (item, key) => {
		switch (item.type) {
			case "row":
			case "col":
			case "grid":
			case "card": {
				if ((item.type === "row" || item.type === "grid") && item.items.length >= 2 && item.items.length <= 4) {
					const cards = item.items.flatMap((card) => card.type === "card" && card.title && card.title.length <= 40 && (card.eyebrow?.length ?? 0) <= 12 && card.items.length === 1 && card.items[0]?.type === "keyvalue" && card.items[0].pairs.length <= 8 && card.items[0].pairs.every((p) => p.key.length <= 40 && p.value.length <= 80) ? [{
						title: card.title,
						...card.eyebrow ? { badge: card.eyebrow } : {},
						rows: card.items[0].pairs.map((p) => [p.key, p.value])
					}] : []);
					if (cards.length === item.items.length) return {
						type: "compare",
						items: cards
					};
				}
				const c = children(item.items, key);
				if (item.type === "card") {
					if (item.title) c.unshift(text(item.title));
					if (item.eyebrow) c.unshift(text(item.eyebrow));
				}
				return {
					type: item.type === "row" || item.type === "grid" ? "row" : "stack",
					children: c
				};
			}
			case "text": return {
				...text(item.content),
				...item.size === "muted" || item.size === "caption" ? { tone: "muted" } : {}
			};
			case "stat": {
				const m = {
					type: "metric",
					label: item.label,
					value: item.value,
					...item.delta ? { caption: item.delta } : {}
				};
				return item.spark ? stack([m, {
					type: "chart",
					kind: "line",
					categories: item.spark.map((_, i) => String(i + 1)),
					series: [{ values: item.spark }]
				}]) : m;
			}
			case "hero": return stack([
				text(item.title),
				...item.value ? [{
					type: "metric",
					label: item.label ?? item.title,
					value: item.value,
					...item.delta ? { caption: item.delta } : {}
				}] : item.delta || item.label ? [text([item.label, item.delta].filter(Boolean).join(" · "))] : [],
				...item.subtitle ? [text(item.subtitle)] : [],
				...item.spark ? [{
					type: "chart",
					kind: "line",
					categories: item.spark.map((_, i) => String(i + 1)),
					series: [{ values: item.spark }]
				}] : []
			]);
			case "badge": return text(item.label);
			case "divider": return text(item.label ?? "—");
			case "spacer": return text("");
			case "callout": return {
				type: "callout",
				text: [item.title, item.content].filter(Boolean).join("\n"),
				tone: tone(item.tone) ?? "info"
			};
			case "progress": {
				if (surface === "fence") return panelOnly(key);
				const p = {
					type: "progress",
					value: item.value,
					...item.label ? { label: item.label } : {},
					...item.valueLabel ? { caption: item.valueLabel } : {}
				};
				return item.target === void 0 ? p : stack([p, text(`${en ? "Target" : "目标"}: ${item.target}%`)]);
			}
			case "steps": return {
				type: "steps",
				items: item.steps.map((step, i) => ({
					label: step.title,
					status: i < (item.current ?? item.steps.length) ? "done" : i === item.current ? "current" : "todo",
					...step.desc ? { detail: step.desc } : {}
				}))
			};
			case "timeline": return {
				type: "steps",
				items: item.items.map((i) => ({
					label: i.title,
					status: "todo",
					...[i.time, i.desc].some(Boolean) ? { detail: [i.time, i.desc].filter(Boolean).join(" · ") } : {}
				}))
			};
			case "keyvalue": return surface === "fence" ? stack(item.pairs.map((p) => text(`${p.key}: ${p.value}`))) : {
				type: "keyValue",
				items: item.pairs.map((p) => [p.key, p.value])
			};
			case "list": {
				const q = item.filter ? state.fields[item.filter]?.toLowerCase() ?? "" : "";
				const entries = item.items.map((item, index) => ({
					item,
					index
				})).filter(({ item }) => !q || JSON.stringify(item).toLowerCase().includes(q));
				const rows = entries.map((e) => e.item);
				if (surface === "panel" && rows.every((i) => typeof i === "string" || !("type" in i) || i.type === "button" || i.type === "link")) {
					const items = entries.map(({ item: i, index }) => {
						if (typeof i === "string") return { title: i };
						if (!("type" in i)) return {
							title: i.title,
							...i.desc ? { subtitle: i.desc } : {}
						};
						if (i.type !== "button" && i.type !== "link") throw new Error("native list row violated its checked component kind");
						const result = node(i, `${key}.${index}`);
						const id = result.type === "actions" ? result.items[0]?.action : void 0;
						return {
							title: i.label,
							...id ? { action: id } : {}
						};
					});
					if (!issues.length) return {
						type: "list",
						items
					};
				}
				if (rows.every((i) => typeof i === "string" || !("type" in i))) {
					const values = rows.map((i) => typeof i === "string" ? { title: i } : {
						title: i.title,
						...i.desc ? { subtitle: i.desc } : {}
					});
					return surface === "fence" ? stack(values.map((i) => text([i.title, i.subtitle].filter(Boolean).join("\n")))) : {
						type: "list",
						items: values
					};
				}
				return stack(entries.map(({ item: i, index }) => typeof i === "string" ? text(i) : "type" in i ? node(i, `${key}.${index}`) : text([i.title, i.desc].filter(Boolean).join("\n"))));
			}
			case "table": {
				if (surface === "fence") return panelOnly(key);
				if (item.export && surface !== "panel") return panelOnly(key);
				if (item.details?.some(Boolean) || item.types?.some((t) => ![
					"text",
					"num",
					"delta",
					"badge",
					"index"
				].includes(t))) return unsupported(key, "table details/graphic cells");
				const scalar = (v) => typeof v === "object" && v !== null && GENUI_COMPUTED_CELL in v ? v.value : v;
				const display = (v) => typeof v === "object" && v !== null && GENUI_COMPUTED_CELL in v ? v.formatted : v;
				let rows = item.rows;
				const q = item.filter ? state.fields[item.filter]?.toLowerCase() ?? "" : "";
				if (q) rows = rows.filter((row) => (item.filterColumn === void 0 ? row : [row[item.filterColumn]]).some((v) => tableCellText(v).toLowerCase().includes(q)));
				const sort = item.sortField ? item.columns.indexOf(state.fields[item.sortField] ?? "") : -1;
				if (sort >= 0) rows = [...rows].sort((a, b) => typeof scalar(a[sort]) === "number" && typeof scalar(b[sort]) === "number" ? Number(scalar(a[sort])) - Number(scalar(b[sort])) : tableCellText(a[sort]).localeCompare(tableCellText(b[sort])));
				if (rows.some((r) => r.some((v) => typeof display(v) !== "string" && typeof display(v) !== "number"))) return unsupported(key, "table cell value");
				const values = rows.map((r, i) => r.map((v, j) => item.types?.[j] === "index" ? i + 1 : display(v)));
				if (item.total) values.push(item.columns.map((_, j) => j === 0 ? en ? "Total" : "合计" : rows.every((r) => typeof scalar(r[j]) === "number") ? rows.reduce((sum, r) => sum + Number(scalar(r[j])), 0) : ""));
				const table = {
					type: "table",
					columns: item.columns,
					rows: values
				};
				if (!item.export) return table;
				const exports = [{
					type: "copy",
					label: en ? "Copy Markdown" : "复制 Markdown",
					text: tableToMarkdown(item.columns, item.rows)
				}, {
					type: "copy",
					label: en ? "Copy CSV" : "复制 CSV",
					text: tableToCsv(item.rows)
				}];
				return stack([table, ...exports.map((copy, i) => node(copy, `${key}.export${i}`))]);
			}
			case "chart": {
				if (item.stacked) return unsupported(key, "stacked chart");
				const series = item.series?.length ? item.series : [{
					label: "",
					data: item.data
				}];
				const q = item.filter ? state.fields[item.filter]?.toLowerCase() ?? "" : "";
				const categories = [...new Set(series.flatMap((s) => s.data.map((p) => p.label)))].filter((l) => !q || l.toLowerCase().includes(q));
				if (series.some((s) => new Set(s.data.map((p) => p.label)).size !== s.data.length || s.data.some((p) => p.value !== null && typeof p.value !== "number"))) return unsupported(key, "chart labels/values");
				if (item.kind === "donut" && series.length > 1) return unsupported(key, "multiple donut series");
				return {
					type: "chart",
					kind: item.kind === "line" || item.kind === "donut" ? item.kind : item.horizontal ? "hbar" : "bar",
					categories,
					series: series.map((s) => ({
						name: s.label,
						values: categories.map((l) => s.data.find((p) => p.label === l)?.value ?? null)
					}))
				};
			}
			case "button": return !item.action ? text(item.label) : surface === "panel" ? {
				type: "actions",
				items: [{
					label: item.label,
					action: action(item, key),
					...item.tone === "primary" ? { style: "primary" } : {}
				}]
			} : choices(item, key, [item.label]);
			case "select":
			case "radio": {
				if (surface === "fence" && (!item.action || item.type === "radio" && item.group)) return panelOnly(key);
				const group = item.type === "select" ? item.id : item.group;
				const value = state.fields[group ?? key] ?? (item.selected === void 0 ? void 0 : item.options[item.selected]);
				return labeled(item.label, choices(item, key, item.options, value === void 0 ? [] : [value]));
			}
			case "checkbox":
			case "switch": {
				if (surface === "tool" || surface === "fence" && (!item.action || item.type === "checkbox" && item.group)) return panelOnly(key);
				if (surface === "fence") return labeled(item.label, {
					type: "confirm",
					confirmLabel: en ? "Enable" : "开启",
					cancelLabel: en ? "Disable" : "关闭"
				});
				const group = item.type === "checkbox" ? item.group : void 0;
				const checked = state.choices[group ?? key]?.includes(item.type === "checkbox" ? item[GENUI_CHECKBOX_VALUE] ?? item.label : item.label) ?? item.checked ?? false;
				return labeled(`${item.label} · ${checked ? en ? "On" : "已开启" : en ? "Off" : "已关闭"}`, {
					type: "confirm",
					id: action(item, key),
					confirmLabel: en ? "Enable" : "开启",
					cancelLabel: en ? "Disable" : "关闭"
				});
			}
			case "tabs": {
				if (surface !== "panel") return panelOnly(key);
				if (item.tabs.length > 8) return unsupported(key, "tabs option limit");
				const selected = state.tabs[key] ?? 0, tab = item.tabs[selected] ?? item.tabs[0];
				return stack([{
					type: "options",
					id: action(item, key, "tab"),
					options: item.tabs.map((t, i) => ({
						label: t.label,
						value: String(i)
					})),
					selected: [String(selected)]
				}, ...children(tab?.items ?? [], `${key}.t${selected}`)]);
			}
			case "accordion": {
				if (surface !== "panel") return panelOnly(key);
				if (item.items.length > 8) return unsupported(key, "accordion option limit");
				const selected = state.choices[key] ?? [];
				return stack([{
					type: "options",
					id: action(item, key, "accordion"),
					multi: true,
					selected,
					options: item.items.map((s, i) => ({
						label: s.title,
						value: String(i)
					}))
				}, ...item.items.flatMap((s, i) => selected.includes(String(i)) ? [text(s.title), ...children(s.items, `${key}.a${i}`)] : [])]);
			}
			case "copy": return surface !== "panel" ? panelOnly(key) : !item.text.length ? unsupported(key, en ? "no content to copy" : "没有可复制的内容") : item.text.length > 8e3 ? unsupported(key, "clipboard limit") : {
				type: "actions",
				items: [{
					label: item.label ?? (en ? "Copy" : "复制"),
					action: action(item, key)
				}]
			};
			case "link":
				if (!item.href) return text(item.label);
				if (surface !== "panel") return panelOnly(key);
				try {
					const url = new URL(item.href);
					if (url.protocol !== "https:" || url.username || url.password || item.href.length > 2048) return unsupported(key, "link scheme/credentials");
				} catch {
					return unsupported(key, "link URL");
				}
				return {
					type: "actions",
					items: [{
						label: item.label,
						action: action(item, key)
					}]
				};
			case "image":
				if (surface === "fence") return panelOnly(key);
				if (!/^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/u.test(item.src) || item.src.length > 65536) return unsupported(key, "image needs embedded PNG/JPEG/GIF/WebP");
				return {
					type: "image",
					src: item.src,
					...item.alt ? { alt: item.alt } : {},
					...item.caption ? { caption: item.caption } : {}
				};
			case "image-group": return stack(item.items.map((i, n) => node({
				type: "image",
				...i
			}, `${key}.${n}`)));
			case "submit": {
				if (surface !== "panel") return panelOnly(key);
				const { registry, resolved: submission } = nativeSubmission(spec, state, item.groups);
				const members = (item.groups ?? [...registry.members.keys()]).flatMap((k) => registry.members.get(k) ? [registry.members.get(k)] : []);
				if (item.groups && members.some((m) => m.kind === "field" && m.fieldType !== "select")) return unsupported(key, en ? "this form requires an input the native App does not provide" : "此表单需要原生界面尚未提供的输入项");
				if (!item.action && !submission.localGradeEligible) return text(item.label);
				return state.feedback[key] ? stack([...feedbackBlocks(state.feedback[key]), {
					type: "actions",
					items: [{
						label: en ? "Try again" : "重新作答",
						action: action(item, key, "reset")
					}]
				}]) : {
					type: "actions",
					items: [{
						label: item.label ?? (en ? "Submit" : "提交"),
						action: action(item, key)
					}]
				};
			}
			case "quiz": {
				if (surface !== "panel") return panelOnly(key);
				const selected = state.choices[key] ?? [], answer = selected[0] === void 0 ? void 0 : item.options[Number(selected[0])];
				return stack([
					text(item.question),
					{
						type: "options",
						id: action(item, key),
						options: item.options.map((o, i) => ({
							label: o.label,
							value: String(i)
						})),
						selected
					},
					...answer ? [{
						type: "callout",
						tone: answer.correct ? "good" : "warn",
						text: answer.feedback ?? item.explanation ?? (answer.correct ? en ? "Correct" : "回答正确" : en ? "Try again" : "再想一想")
					}] : []
				]);
			}
			case "code": return text(item.code);
			case "json": return text(JSON.stringify(item.value, null, 2));
			case "avatar": return text(item.name);
			case "breadcrumb": return text(item.items.join(" › "));
			case "icon": return text(item.label ?? item.name);
			case "arrow": return text([item.dir === "right" ? "→" : "↓", item.label].filter(Boolean).join(" "));
			default: return unsupported(key, item.type);
		}
	};
	const resolved = spec.computed?.length ? resolveComputedSpec(spec, evaluateComputed(spec, state.fields)) : spec;
	return {
		view: {
			...stack(children(resolved.items, "n")),
			...spec.title ? { title: spec.title } : {}
		},
		actions,
		issues,
		identity
	};
}
/** The published native budgets; refuse truncation of meaningful content. */
function fitsNativeView(view, surface) {
	let count = 0;
	const panel = surface === "panel";
	const visit = (v, depth) => {
		if (++count > (panel ? 120 : 40) || depth > (panel ? 8 : 6)) return false;
		for (const [key, value] of Object.entries(v)) if (typeof value === "string" && value.length > (key === "src" ? 65536 : key === "text" ? 2e3 : key === "title" ? 80 : 200)) return false;
		if (v.type === "stack" || v.type === "row") {
			const c = v.children;
			if (!c.length || c.length > (panel ? 32 : 16) || !c.every((p) => visit(p, depth + 1))) return false;
		}
		if (v.type === "chart") {
			const c = v.categories, s = v.series;
			if (c.length > 60 || c.some((l) => l.length > 200) || s.length > 6 || s.some((i) => (i.name?.length ?? 0) > 200)) return false;
		}
		if (v.type === "table") {
			const c = v.columns, r = v.rows;
			if (c.length > 8 || c.some((l) => l.length > 200) || r.length > 50 || r.some((row) => row.length !== c.length || row.some((v) => String(v).length > 200))) return false;
		}
		if (v.type === "steps") {
			const a = v.items;
			if (a.length > 12 || a.some((i) => i.label.length > 200 || (i.detail?.length ?? 0) > 200)) return false;
		}
		if (v.type === "keyValue") {
			const a = v.items;
			if (a.length > 24 || a.some((p) => p.some((v) => v.length > 200))) return false;
		}
		if (v.type === "list") {
			const a = v.items;
			if (a.length > 50 || a.some((i) => i.title.length > 200 || (i.subtitle?.length ?? 0) > 200)) return false;
		}
		if (v.type === "options") {
			const a = v.options;
			if (a.length > 8 || a.some((i) => !i.label.trim() || i.label.length > 80 || (i.description?.length ?? 0) > 200 || (i.value?.length ?? 0) > 200)) return false;
		}
		if (v.type === "compare") {
			const a = v.items;
			if (a.length < 2 || a.length > 4 || a.some((i) => i.title.length > 40 || (i.badge?.length ?? 0) > 12 || i.rows.length > 8 || i.rows.some((row) => row[0].length > 40 || row[1].length > 80))) return false;
		}
		if (v.type === "actions") {
			const a = v.items;
			if (a.length > 4 || a.some((i) => i.label.length > 200 || i.action.length > 64)) return false;
		}
		if ((v.type === "options" || v.type === "confirm") && typeof v.id === "string" && v.id.length > 64) return false;
		return true;
	};
	return visit(view, 1) && new TextEncoder().encode(JSON.stringify(view)).length <= (panel ? 32768 : surface === "fence" ? 16384 : 8192);
}
/** Fixed stack root is deliberately unknown to the web component vocabulary. */
function dualNativeFence(spec) {
	if (spec.panel || spec.append) return null;
	const r = compileDshGo(spec, "fence");
	if (r.issues.length || !fitsNativeView(r.view, "fence")) return null;
	const answers = (v) => Number(v.type === "options" || v.type === "confirm") + (v.children ?? []).reduce((sum, c) => sum + answers(c), 0);
	if (answers(r.view) > 1) return null;
	const dual = {
		...spec,
		...r.view
	};
	return new TextEncoder().encode(JSON.stringify(dual)).length <= 16384 ? dual : null;
}
//#endregion
//#region src/plugin/dsh-go-view.ts
/** A complete read-only projection; tool cards have no native action handler. */
function toDshGoView(spec) {
	try {
		if (spec.panel || spec.append) return null;
		const result = compileDshGo(spec, "tool");
		return result.issues.length || !fitsNativeView(result.view, "tool") ? null : result.view;
	} catch {
		return null;
	}
}
//#endregion
//#region src/plugin/tool.ts
/**
* Arguments schema: an open `spec` slot. The schema must NOT reject anything
* the guard could repair — the model's component trees are imperfect by
* nature, and the guard heals them; argument validation would only strand
* them. `additionalProperties: false` keeps the call shape honest.
*
* `spec` IS typed `object` on purpose: the guard can only repair plain
* records (a serialized JSON string, array, or scalar root is unusable), so
* argument validation rejecting non-objects loses nothing repairable — and
* it stops the model from double-encoding the tree as a string (observed
* twice in the wild), failing fast with a clear schema error instead.
*/
const RENDER_UI_PARAMETERS = {
	type: "object",
	properties: { spec: {
		type: "object",
		description: [
			"Render structured UI for the user (tool-row card). USE THIS whenever the answer contains ≥3 parallel points, a comparison, numbers/metrics, a step sequence, a flow, or a status/report — do NOT write those as markdown bullets or a markdown table.",
			"Same white-listed vocabulary as the ```dsh-ui fence (see the GenUI system-prompt section). Pick the fence when the UI belongs in the message body; pick this tool when the deliverable is a self-contained card.",
			"Deep-validated and repaired by the renderer. Pass the spec as a JSON OBJECT — never as a serialized JSON string (a string fails argument validation)."
		].join(" "),
		properties: {
			title: {
				type: "string",
				description: "Short title shown as the card banner."
			},
			gap: {
				type: "number",
				description: "Vertical gap between root items in px."
			},
			panel: {
				type: "boolean",
				description: "Panel-only: renders into the session panel dock instead of the message flow."
			},
			items: {
				type: "array",
				description: "Root component list (white-listed vocabulary).",
				items: { type: "object" }
			}
		}
	} },
	required: ["spec"],
	additionalProperties: false
};
/** The tool's canonical value is a short model-facing summary string. */
const RENDER_UI_OUTPUT_SCHEMA = {
	type: "string",
	description: "One-line human-readable render summary for the model."
};
/**
* Read the `spec` argument defensively (presenters run on replayed args).
*
* The harness tool-call bridge has been observed to deliver arguments in
* shapes other than the authored `{ spec: <object> }`:
* - `{ spec: "<JSON string>" }` — spec serialized to text;
* - `{ arguments: "<JSON string>" }` / `{ arguments: <object> }` — a
*   double-encoded wrapper from the SDK tool-call bridge (seen live in the
*   web GUI: small specs arrived wrapped this way, large specs arrived with
*   their JSON corrupted mid-stream);
* - a bare JSON string (double-encoded root).
* Each shape is unwrapped here so the guard can repair the actual tree.
* Corrupted JSON cannot be recovered (bytes were lost in transit): it yields
* `undefined` plus a diagnostic log line for the transport-layer bug.
*/
function specOf(args) {
	if (typeof args === "string") return parseSpecJson(args, "bare-string");
	if (typeof args !== "object" || args === null) return void 0;
	const record = args;
	if ("spec" in record) {
		const s = record.spec;
		if (typeof s === "string") return parseSpecJson(s, "spec-string");
		return unwrapSpec(s, "spec");
	}
	if ("arguments" in record) {
		const a = record.arguments;
		if (typeof a === "string") return parseSpecJson(a, "arguments-string");
		if (typeof a === "object" && a !== null) return unwrapSpec(a, "arguments");
	}
}
/**
* Peel nested `{ spec: ... }` wrapper layers. Observed bridge shapes nest the
* authored `spec` object one or more levels deep (e.g. the serialized text
* inside `{ arguments: "..." }` is itself `{ spec: { title, gap, items } }`),
* so unwrapping stops only at a value that carries no `spec` key.
*/
function unwrapSpec(value, shape) {
	if (typeof value === "object" && value !== null) {
		const record = value;
		if ("spec" in record) {
			const s = record.spec;
			if (typeof s === "string") return parseSpecJson(s, `${shape}/spec-string`);
			return unwrapSpec(s, `${shape}/spec`);
		}
	}
	return value;
}
/** Try to decode a serialized spec; log a diagnostic when it is broken. */
function parseSpecJson(raw, shape) {
	try {
		return unwrapSpec(JSON.parse(raw), shape);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		const pos = /position (\d+)/.exec(detail)?.[1] ?? "?";
		console.error(`[genui-tool] spec wrapped as ${shape} but its JSON is broken (${raw.length} bytes, error at ${pos}); cannot recover — bytes lost in transit`);
		return;
	}
}
/** Process a raw tool value once for all render-time decisions. */
function processRenderableValue(value) {
	return processGenuiSpec(value);
}
/** Wrap model-facing validation fields in the stable GenUI protocol envelope. */
function validationProtocol(lines) {
	return [
		"[genui-validation]",
		...lines,
		"reply_language=conversation"
	].join("\n");
}
/** Render process diagnostics as stable model-facing warning fields. */
function formatProcessWarnings(processed) {
	return processed.warnings.map((warning) => {
		if (warning.kind === "alias" && warning.canonical !== void 0) {
			const separator = warning.path.lastIndexOf(".");
			const canonicalPath = `${separator < 0 ? "" : warning.path.slice(0, separator + 1)}${warning.canonical}`;
			return warning.message.includes("ignored") ? `warning=alias_ignored path=${warning.path} canonical=${canonicalPath}` : `warning=alias_normalized path=${warning.path} canonical=${canonicalPath}`;
		}
		if (warning.kind === "unknown-field") return `warning=unknown_field path=${JSON.stringify(warning.path)} detail=${JSON.stringify(warning.message)}`;
		if (warning.kind === "truncated") return `warning=policy_truncated path=${JSON.stringify(warning.path)} detail=${JSON.stringify(warning.message)}`;
		return `warning=process detail=${JSON.stringify(warning.message)}`;
	});
}
/** 将行内字段的块级 Markdown 诊断写入稳定的验证协议。 */
function formatInlineContentWarnings(spec) {
	return collectInlineContentWarnings(spec).map((warning) => `warning=block_markdown path=${warning.path} kind=${warning.kind} replacement=${warning.replacement}`);
}
/** Format chart-specific process errors while keeping other schema errors generic. */
function formatProcessFailure(processed) {
	const chartErrors = processed.errors.filter((error) => /(?:variant is unsupported|kind must be bars, line, or donut|requires data or series|(?:data|series) is required for|(?:\.data|\.series)(?:\[\d+\])?(?:\.(?:data|label|value|color))? must|series is only supported for bars)/.test(error));
	return chartErrors.length === 0 ? void 0 : validationProtocol([
		"status=invalid",
		"error=invalid_chart_fields",
		...chartErrors.map((error) => `diagnostic=${JSON.stringify(error)}`),
		"next=fix_and_revalidate"
	]);
}
/** Tool-call title shared by the pending and completed presentations. */
function cardTitle(args) {
	const processed = processRenderableValue(specOf(args));
	if (!isRenderableProcess(processed) || processed.spec === null) return void 0;
	return `渲染 UI：${processed.spec.title ?? "未命名"}`;
}
/**
* Build the render_ui tool definition. Registered by the plugin node half;
* `ctx.tools.register` consumes it exactly like a `defineTool` result.
*/
function createRenderUiTool() {
	return {
		name: "render_ui",
		description: "Render an interactive UI card in the conversation tool row by passing a GenUI spec (a white-listed component tree; the same vocabulary as the ```dsh-ui fence, see the system prompt). Use it when the user asks for a structured panel, dashboard, or form that belongs in the tool row rather than inline in the reply. The card is interactive client-side (tabs, buttons, inputs, switches); components carrying an \"action\" field send [genui-action] back to you when the user interacts, and you should re-render the updated UI.",
		parameters: RENDER_UI_PARAMETERS,
		output: {
			schema: RENDER_UI_OUTPUT_SCHEMA,
			render(_args, value) {
				return [{
					type: "text",
					text: String(value)
				}];
			},
			presentationMeta(args) {
				const processed = processRenderableValue(specOf(args));
				if (!isRenderableProcess(processed) || processed.spec === null) return null;
				const nativeView = toDshGoView(processed.spec);
				return nativeView === null ? processed.spec : {
					...processed.spec,
					"dsh-go/view": nativeView
				};
			}
		},
		async execute(args) {
			const processed = processRenderableValue(specOf(args));
			if (processed.spec === null) return [
				"[genui-render]",
				"status=invalid",
				"error=invalid_spec",
				"required=items",
				"next=fix_and_retry",
				"reply_language=conversation"
			].join("\n");
			if (!isRenderableProcess(processed)) throw new Error("render_ui spec invalid: " + processed.errors.join("; "));
			const spec = processed.spec;
			const warnings = formatProcessWarnings(processed);
			return [
				"[genui-render]",
				"status=rendered",
				...spec.title === void 0 ? [] : [`title=${JSON.stringify(spec.title)}`],
				`rendered=${processed.renderedCount}`,
				"action_feedback=[genui-action]",
				...warnings,
				"reply_language=conversation"
			].join("\n");
		},
		presentCall(args) {
			const title = cardTitle(args);
			return title === void 0 ? void 0 : {
				card: "generic",
				title,
				kind: "other"
			};
		},
		presentResult(args) {
			const title = cardTitle(args);
			return title === void 0 ? void 0 : {
				card: "generic",
				title
			};
		}
	};
}
/**
* The `validate_dsh_ui` tool: a model-facing pre-flight check for the
* ```dsh-ui fence channel. The model calls it with the JSON text it is about
* to put inside a fence; it reports whether the body parses as a valid GenUI
* spec, and when it does not, WHERE it breaks and WHAT is likely wrong
* (bracket counts, common typo classes) so the model can fix and re-validate
* before emitting — turning "render a red banner after the fact" into
* "verify before you send". Purely local: no LLM, no network, no DOM.
*/
const VALIDATE_DESCRIPTION = "Validate the JSON body of a ```dsh-ui fence BEFORE emitting it — use for non-trivial specs (≥3 nodes or containing a table); skip for trivial ones (≤2 nodes). Pass the exact JSON text you are about to put inside the fence as the \"spec\" argument (a string). Returns a [genui-validation] protocol block with status, diagnostics, next action, and reply_language=conversation. When invalid JSON is repairable, repaired_json contains the fixed body; emit it only with next=emit_repaired_fence. A warning=unknown_field requires fixing the indicated path and another validation call. A warning=block_markdown requires the indicated replacement node and another validation call. When native_fence_json is returned, emit that exact JSON: it keeps the web items and adds the existing dsh-go native projection. Native [dsh-ui reply] messages carry visible choices, not hidden action payloads.";
const VALIDATE_PARAMETERS = {
	type: "object",
	properties: { spec: {
		oneOf: [{
			type: "string",
			description: "The exact JSON text of the fence body."
		}, {
			type: "object",
			description: "The spec object (serialized before validation)."
		}],
		description: "The dsh-ui fence body to validate: pass the JSON as a string for an exact check, or as the spec object."
	} },
	required: ["spec"],
	additionalProperties: false
};
/** Read the fence-body text from the call args (string preferred, object serialized). */
function fenceTextOf(args) {
	if (typeof args === "string") return args;
	if (typeof args !== "object" || args === null) return null;
	const record = args;
	const s = "spec" in record ? record.spec : "arguments" in record ? record.arguments : void 0;
	if (typeof s === "string") return s;
	if (typeof s === "object" && s !== null) return JSON.stringify(s);
	return null;
}
/** Count structural brackets outside string literals. */
function bracketCounts(raw) {
	const counts = {
		"{": 0,
		"}": 0,
		"[": 0,
		"]": 0
	};
	let inString = false;
	let escaped = false;
	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (inString) {
			if (ch === "\\") escaped = true;
			else if (ch === "\"") inString = false;
			continue;
		}
		if (ch === "\"") {
			inString = true;
			continue;
		}
		if (ch === "{") counts["{"] += 1;
		else if (ch === "}") counts["}"] += 1;
		else if (ch === "[") counts["["] += 1;
		else if (ch === "]") counts["]"] += 1;
	}
	return counts;
}
/** Return stable structural count fields for an invalid JSON body. */
function bracketDiagnostic(raw) {
	const c = bracketCounts(raw);
	const fields = [
		`braces_open=${c["{"]}`,
		`braces_close=${c["}"]}`,
		`brackets_open=${c["["]}`,
		`brackets_close=${c["]"]}`
	];
	if (c["{"] !== c["}"]) {
		const d = c["{"] - c["}"];
		fields.push(`brace_delta=${d}`, `brace_action=${d > 0 ? `add:${d}` : `remove:${-d}`}`);
	}
	if (c["["] !== c["]"]) {
		const d = c["["] - c["]"];
		fields.push(`bracket_delta=${d}`, `bracket_action=${d > 0 ? `add:${d}` : `remove:${-d}`}`);
	}
	return fields;
}
const COMMON_CAUSES = "likely_causes=unbalanced_delimiters,unescaped_quote,trailing_comma,unterminated_string";
/** Build the validate_dsh_ui tool definition (registered alongside render_ui). */
function createValidateDshUiTool() {
	return {
		name: "validate_dsh_ui",
		description: VALIDATE_DESCRIPTION,
		parameters: VALIDATE_PARAMETERS,
		output: {
			schema: {
				type: "string",
				description: "Validation verdict for the model."
			},
			render(_args, value) {
				return [{
					type: "text",
					text: String(value)
				}];
			}
		},
		async execute(args) {
			const raw = fenceTextOf(args);
			if (raw === null || raw.trim() === "") return validationProtocol([
				"status=invalid",
				"error=missing_spec",
				"next=provide_spec"
			]);
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch (error) {
				const detail = error instanceof Error ? error.message : String(error);
				const repaired = completeFenceJson(raw);
				if (repaired !== null) {
					const processed = processRenderableValue(JSON.parse(repaired.text));
					const chartFailure = formatProcessFailure(processed);
					if (chartFailure !== void 0) return chartFailure;
					if (processed.spec !== null && processed.errors.length === 0) {
						const warnings = formatProcessWarnings(processed);
						const inlineWarnings = formatInlineContentWarnings(processed.spec);
						const requiresCorrection = inlineWarnings.length > 0 || processed.warnings.some((warning) => warning.kind === "unknown-field");
						return `${validationProtocol([
							"status=invalid",
							"error=invalid_json",
							`detail=${JSON.stringify(detail)}`,
							...bracketDiagnostic(raw),
							...warnings,
							...inlineWarnings,
							"repair=applied",
							`repair_count=${repaired.repairs}`,
							requiresCorrection ? "next=fix_and_revalidate" : "next=emit_repaired_fence"
						])}\nrepaired_json:\n\`\`\`\n${repaired.text}\n\`\`\``;
					}
				}
				return validationProtocol([
					"status=invalid",
					"error=invalid_json",
					`detail=${JSON.stringify(detail)}`,
					...bracketDiagnostic(raw),
					"repair=failed",
					COMMON_CAUSES,
					"next=fix_and_revalidate"
				]);
			}
			const processed = processRenderableValue(parsed);
			const chartFailure = formatProcessFailure(processed);
			if (chartFailure !== void 0) return chartFailure;
			if (processed.spec === null || processed.errors.length > 0) {
				const dropped = droppedNodeFailure(processed, parsed);
				return dropped === void 0 ? validationProtocol([
					"status=invalid",
					"error=invalid_spec",
					...processed.errors.length === 0 ? ["required=items", "node_types=whitelist"] : processed.errors.map((error) => `diagnostic=${JSON.stringify(error)}`),
					"next=fix_and_revalidate"
				]) : validationProtocol([
					"status=invalid",
					...dropped,
					"next=fix_and_revalidate"
				]);
			}
			const warnings = formatProcessWarnings(processed);
			const inlineWarnings = formatInlineContentWarnings(processed.spec);
			const requiresCorrection = inlineWarnings.length > 0 || processed.warnings.some((warning) => warning.kind === "unknown-field");
			const verdict = validationProtocol([
				"status=valid",
				`rendered=${processed.renderedCount}`,
				...warnings,
				...inlineWarnings,
				requiresCorrection ? "next=fix_and_revalidate" : "next=emit_fence"
			]);
			const native = requiresCorrection ? null : dualNativeFence(processed.spec);
			return native === null ? verdict : `${verdict}\nnative_fence_json:\n\`\`\`\n${JSON.stringify(native)}\n\`\`\``;
		},
		presentCall() {
			return {
				card: "generic",
				title: "验证 dsh-ui 围栏",
				kind: "other"
			};
		},
		presentResult() {
			return {
				card: "generic",
				title: "验证 dsh-ui 围栏"
			};
		}
	};
}
let repairAttemptsLimit = 32;
/** Single left-to-right pass over the raw body. Tracks the bracket stack
*  (skipping strings/escapes correctly) and records:
*  - every position where the prefix is fully balanced (trailing comma or
*    fence tail) — candidate with an empty closing suffix;
*  - every top-level `items[]` component close — candidate with the root
*    array/object closed (an unfinished trailing component is dropped). Nested
*    object closes are not candidates because their component is still partial.
*  Candidates are ring-buffered to the attempts budget (the LAST pushes are
*  the longest), then returned longest-first, deduplicated by end. The scan
*  stops at the first unbalanced close — earlier balanced prefixes remain
*  valid candidates.
*
* Exposed for tests (the `scannedChars` diagnostic); not exported from the
* package entry. The parser calls this exactly once per parse.
*/
function collectPartialCandidates(raw) {
	const stack = [];
	const candidates = [];
	const push = (c) => {
		if (candidates.length >= repairAttemptsLimit) candidates.shift();
		candidates.push(c);
	};
	let inString = false;
	let escaped = false;
	let scanned = 0;
	for (; scanned < raw.length; scanned++) {
		const ch = raw[scanned];
		if (inString) {
			if (escaped) escaped = false;
			else if (ch === "\\") escaped = true;
			else if (ch === "\"") inString = false;
			continue;
		}
		if (ch === "\"") {
			inString = true;
			continue;
		}
		if (ch === "{" || ch === "[") {
			stack.push(ch);
			continue;
		}
		if (ch === "}" || ch === "]") {
			if (stack.pop() !== (ch === "}" ? "{" : "[")) break;
			if (stack.length > 0 && stack[stack.length - 1] === "[") {
				let closing = "";
				for (let i = stack.length - 1; i >= 0; i--) closing += stack[i] === "[" ? "]" : "}";
				push({
					end: scanned + 1,
					closingSuffix: closing
				});
			}
			if (stack.length === 0) push({
				end: scanned + 1,
				closingSuffix: ""
			});
			continue;
		}
	}
	candidates.sort((a, b) => b.end - a.end);
	const deduped = [];
	for (const c of candidates) if (deduped.length === 0 || deduped[deduped.length - 1].end !== c.end) deduped.push(c);
	return {
		candidates: deduped.slice(0, repairAttemptsLimit),
		scannedChars: scanned
	};
}
/** Try to parse a candidate as a GenuiSpec. */
function trySpec(candidate, allowSingleComponentRoot) {
	try {
		let value = JSON.parse(candidate);
		if (typeof value === "string") try {
			value = JSON.parse(value);
		} catch {
			return null;
		}
		if (isGenuiSpec(value)) return value;
		if (Array.isArray(value) && value.length > 0) return { items: value };
		return allowSingleComponentRoot ? wrapSingleComponentRoot(value) : null;
	} catch {
		return null;
	}
}
/**
* Parse a possibly incomplete genui spec body.
* @param raw - the fence body as accumulated so far.
* @returns a spec containing only finished components, or null when nothing
*   usable has been written yet.
*/
function parsePartialGenuiSpec(raw) {
	const text = raw.trim();
	if (text === "") return null;
	const full = trySpec(text, true);
	if (full !== null) return full;
	const { candidates } = collectPartialCandidates(text);
	for (const candidate of candidates) {
		const spec = trySpec(text.slice(0, candidate.end) + candidate.closingSuffix, false);
		if (spec !== null) return spec;
	}
	return null;
}
//#endregion
//#region src/shared/fence-resolve.ts
/**
* 使用浏览器 renderer 与 Node 侧最终回复反馈守卫共用的流程解析 dsh-ui 围栏正文。
* @module @changfenhuang/dsh-genui/shared/fence-resolve
*/
/**
* 对已经解析的值执行规格守卫和坏节点清理。
*
* @param value - 已解析或部分解析的围栏值。
* @returns 当前候选正文的规格处理结果。
*/
function resolveParsedFence(value) {
	const processed = processGenuiSpec(value, { deferPanelReferences: true });
	return {
		value,
		processed,
		spec: partialRepairGenuiSpec(processed)
	};
}
/** 返回没有可解析正文的围栏处理结果。 */
function unresolvedFence() {
	return {
		value: null,
		processed: null,
		spec: null
	};
}
/**
* 使用 renderer 的统一流程解析原始 dsh-ui 正文。
*
* 流式生成期间可以使用 tier-1 修复。tier-2 补全修复只允许用于回合结束后的回复，
* 防止未完成的正文提前渲染。
*
* @param raw - dsh-ui 围栏标记之间的原始正文。
* @param options - 流式或回合结束后的解析策略。
* @returns 通过规格守卫的渲染 spec；正文无法渲染时返回 null。
*/
function resolveFence(raw, options) {
	const parsed = parsePartialGenuiSpec(raw);
	let resolution = parsed === null ? unresolvedFence() : resolveParsedFence(parsed);
	if (resolution.spec !== null) return resolution;
	const repaired = repairFenceJson(raw);
	if (repaired !== null) {
		const reparsed = parsePartialGenuiSpec(repaired.text);
		resolution = reparsed === null ? unresolvedFence() : resolveParsedFence(reparsed);
	}
	if (resolution.spec !== null || !options.settled) return resolution;
	const completed = completeFenceJson(raw);
	if (completed === null) return resolution;
	const reparsed = parsePartialGenuiSpec(completed.text);
	return reparsed === null ? unresolvedFence() : resolveParsedFence(reparsed);
}
//#endregion
//#region src/shared/fence-language.ts
/** 围栏开头的 `dsh-ui` 标签在书写时可能被带上标点（```dsh-ui> / ```dsh-ui` …）。
* 这类标记在 mdast 里原样留在 `lang` 上，严格相等判断会让整条围栏静默退化成
* 普通代码块——真实会话里同一个模型可以在一条消息里写出 182 个这样的围栏。
* 这里只吸收**标签之后**的标点，`dsh-ui-something` 这样的真实语言名不受影响。 */
const GENUI_LABEL_PATTERN = /^dsh-ui$/;
const GENUI_TRAILING_PUNCTUATION = /[>`"'.,;:)\]】」』]+$/;
/**
* 把宿主的围栏语言标记规范化成 GenUI 能识别的写法。
*
* @param lang - 宿主 markdown 里的原始 language（可能含尾部标点或大小写差异）
* @returns 规范化后的语言名；无法规范化时返回输入本身
*/
function normalizeFenceLanguage(lang) {
	const trimmed = lang.trim();
	if (GENUI_LABEL_PATTERN.test(trimmed.toLowerCase())) return "dsh-ui";
	const stripped = trimmed.replace(GENUI_TRAILING_PUNCTUATION, "").trim().toLowerCase();
	if (GENUI_LABEL_PATTERN.test(stripped)) return "dsh-ui";
	return lang;
}
/**
* 判断语言标记是否指向 GenUI 围栏。
*
* @param lang - 宿主暴露的围栏语言（`null` = 围栏没有语言）
* @returns 规范化为 `dsh-ui` 时返回 true
*/
function isGenuiFenceLanguage(lang) {
	return typeof lang === "string" && normalizeFenceLanguage(lang) === "dsh-ui";
}
//#endregion
//#region src/plugin/fence-feedback.ts
/** Plugin name recorded on every message this loop steers. */
const FEEDBACK_PLUGIN_NAME = "@changfenhuang/dsh-genui";
/** Source kind persisted by this plugin in Session format v4. */
const FEEDBACK_SOURCE_KIND = `plugin:${FEEDBACK_PLUGIN_NAME}`;
/** Marker prefix inside the correction text: `[genui-fence-repair #<fingerprint>]`. */
const MARKER_PREFIX = "[genui-fence-repair #";
/** Marker prefix written by older plugin versions. */
const LEGACY_MARKER_PREFIX = "[genui 自修 #";
/** Read one language token (≤3 spaces indent); backticks are invalid in a backtick info string. */
const FENCE_OPEN = /^ {0,3}```[ \t]*([^` \t]+)[ \t]*$/u;
/** Any fence closer (the renderer never nests fences in one body). */
const FENCE_CLOSE = /^ {0,3}```[ \t]*$/u;
/** Upper bound on fences inspected per reply — a reply is text, not a corpus. */
const MAX_FENCES = 40;
/**
* Extract every ```dsh-ui fence from one assistant reply.
*
* @param text - the assistant message text.
* @returns the fences in document order (at most {@link MAX_FENCES}).
*/
function extractDshUiFences(text) {
	const lines = text.split("\n");
	const fences = [];
	let open = null;
	for (let line = 0; line < lines.length; line++) {
		const current = lines[line] ?? "";
		if (open === null) {
			const label = FENCE_OPEN.exec(current)?.[1];
			if (isGenuiFenceLanguage(label)) open = {
				start: line + 1,
				index: fences.length + 1
			};
			continue;
		}
		if (!FENCE_CLOSE.test(current)) continue;
		fences.push({
			raw: lines.slice(open.start, line).join("\n"),
			closed: true,
			index: open.index
		});
		open = null;
		if (fences.length >= MAX_FENCES) return fences;
	}
	if (open !== null && fences.length < MAX_FENCES) fences.push({
		raw: lines.slice(open.start).join("\n"),
		closed: false,
		index: open.index
	});
	return fences;
}
/** Stable, log-safe identity of one fence body (same body → same fingerprint). */
function fenceFingerprint(raw) {
	return createHash("sha256").update(raw.trim()).digest("hex").slice(0, 12);
}
/**
* Validate every fence in a reply the way the DOM channel would render it.
*
* @param text - the assistant message text.
* @returns the fences that would stay a raw code block, in document order.
*/
function fenceFailures(text) {
	const failures = [];
	for (const fence of extractDshUiFences(text)) {
		const detail = fenceFailureDetail(fence);
		if (detail !== null) failures.push({
			index: fence.index,
			fingerprint: fenceFingerprint(fence.raw),
			detail
		});
	}
	return failures;
}
/** `null` when this fence renders; otherwise the reason it does not. */
function fenceFailureDetail(fence) {
	const resolution = resolveFence(fence.raw, { settled: true });
	if (resolution.spec !== null) return null;
	if (!fence.closed) return "error=unterminated_fence\nrequired=closing_fence";
	if (resolution.processed !== null) return droppedNodeFailure(resolution.processed, resolution.value)?.join("\n") ?? ["error=invalid_spec", ...resolution.processed.errors.map((error) => `diagnostic=${JSON.stringify(error)}`)].join("\n");
	return "error=invalid_json\nrepair=failed";
}
/**
* Build the correction input for a reply with unrenderable fences.
*
* @param failures - fences {@link fenceFailures} rejected.
* @returns the message text to steer into the running turn.
*/
function fenceCorrectionText(failures) {
	const body = failures.map((failure) => `fence=${failure.index}\nfingerprint=${failure.fingerprint}\n${failure.detail}`).join("\n\n");
	return `${failures.map((failure) => `${MARKER_PREFIX}${failure.fingerprint}]`).join(" ")}\n\n[genui-fence-repair]\nstatus=render_failed\nfences=${failures.length}\nnext=resend_corrected_fence_only\nrepeat_rendered_content=false\nreply_language=conversation\n\n${body}\n`;
}
/**
* Create the identified user-role message this loop steers.
*
* Mirrors `createUserMessage` from `@deepseek-ai/dsh-llm` (id + role + frozen)
* without a runtime dependency on that package: the node half of this plugin
* deliberately imports no `@deepseek-ai/*` values, so a linked or npm-installed
* copy resolves identically on every host.
*
* @param text - the correction text.
* @param sessionFormatVersion - the format recorded by the active session.
* @returns a frozen user message attributed to this plugin as a notice.
*/
function createFeedbackMessage(text, sessionFormatVersion) {
	const source = sessionFormatVersion >= 4 ? {
		kind: FEEDBACK_SOURCE_KIND,
		form: "notice",
		summary: "genui fence repair requested"
	} : {
		kind: "plugin",
		plugin: FEEDBACK_PLUGIN_NAME,
		form: "notice",
		summary: "genui fence repair requested"
	};
	const message = {
		id: randomUUID(),
		role: "user",
		content: [{
			type: "text",
			text
		}],
		source
	};
	Object.freeze(message.content);
	return Object.freeze(message);
}
/**
* Decide whether this turn boundary should steer a correction — the pure core of
* the loop, so every bound (per-turn cap, per-fence ledger, cancellation) is
* testable without a host.
*
* The decision is driven by FORMAL events only: fences in the reply body, a
* `validate_dsh_ui` call, a delivered body text or a successful `render_ui`
* result. The reasoning block is
* never read here — a draft inside the thinking block is not proof that the model
* chose to deliver it, so it must not change any decision.
*
* @param input - reply text, turn identity, formal signals, and the accounting.
* @returns the correction to send, or null when the loop must stay silent.
*/
function planFenceFeedback(input) {
	if (input.aborted) return null;
	const used = input.correctionsTurn === input.turn ? input.correctionsThisTurn ?? 0 : 0;
	if (used >= 2) return null;
	const failures = fenceFailures(input.text).filter((failure) => !input.correctedSpec.has(failure.fingerprint));
	if (failures.length > 0) return {
		text: fenceCorrectionText(failures),
		fingerprints: failures.map((failure) => failure.fingerprint),
		turn: input.turn,
		kind: "render"
	};
	if (input.validatedThisTurn !== true || input.deliveredThisTurn === true) return null;
	if (input.deliveryRemindedTurns?.has(input.turn) === true) return null;
	return {
		text: missingBodyCorrectionText(input.turn, used + 1, input.renderUiToolEnabled ?? true),
		fingerprints: [],
		turn: input.turn,
		kind: "delivery"
	};
}
/**
* Correction for a validated GenUI turn that reached the boundary without any
* formal delivery.
*
* @param turn - turn that reached the boundary.
* @param attempt - correction number within the shared turn budget.
* @param renderUiToolEnabled - whether the correction may recommend `render_ui`.
* @returns the message text to steer into the running turn.
*/
function missingBodyCorrectionText(turn, attempt = 1, renderUiToolEnabled = true) {
	return `${`${MARKER_PREFIX}turn-${turn}]\n\n[genui-fence-repair]\nstatus=nothing_delivered\nfences=0\nnext=emit_fence_in_body\nrepeat_rendered_content=false\nreply_language=conversation\n\n`}本轮尚未产生正式回答，也没有通过支持的通道交付结果${attempt <= 1 ? "" : `（第 ${attempt} 次提醒）`}。请根据用户当前请求完成正式答复；需要 UI 时，在回答正文输出你最终选定的 dsh-ui 围栏${renderUiToolEnabled ? "，或明确调用 render_ui" : ""}。可以修改或放弃此前候选；不能完成时，请在正文说明原因。\n`;
}
/**
* 将 GenUI 回合中仅含 reasoning 的完整响应转换为宿主已有的可重试空响应错误。
*
* 只有回合边界确实还能发送交付提醒时，才放行原始 stop，
* 让回合正常结束并走到 `agent/turn-stopping` 边界——那里会 steer 一条交付提醒，
* 回合因此继续到下一个 step，模型有机会在同一回合把内容补进正文。
* 提醒发过仍然只有 reasoning，才用 EMPTY_RESPONSE 交给宿主重试兜底。
*
* @param options - LLM stream waterfall 拦截的请求。
* @param source - 本次请求的 provider stream。
* @param state - 当前回合状态；缺省时没有可用提醒，保留宿主重试。
* @param feedbackEnabled - 同回合修正是否启用。关闭时没有提醒可用，保持原有改写行为。
* @returns 原始 stream；仅在提醒已发出、或提醒不可用时改写 reasoning-only 终止。
*/
async function* retryReasoningOnlyGenuiStream(options, source, state, feedbackEnabled = true) {
	const { EMPTY_RESPONSE_CODE, isAgentLoopRequest } = await import("@deepseek-ai/dsh-llm");
	if (!isAgentLoopRequest(options)) {
		yield* source;
		return;
	}
	let hasReasoningBlock = false;
	let hasOtherBlock = false;
	for await (const chunk of source) {
		if (chunk.type === "block-end") {
			if (chunk.block.type === "reasoning") hasReasoningBlock = true;
			else hasOtherBlock = true;
		}
		if (chunk.type === "finish" && chunk.reason.kind === "stop" && hasReasoningBlock && !hasOtherBlock) {
			if (feedbackEnabled && state !== void 0 && state.currentTurn !== void 0 && state.pendingRenders.size === 0 && planFenceFeedback({
				text: "",
				turn: state.currentTurn,
				correctedSpec: state.correctedSpec,
				deliveryRemindedTurns: state.deliveryRemindedTurns,
				validatedThisTurn: state.validatedThisTurn,
				deliveredThisTurn: state.deliveredThisTurn,
				aborted: options.signal?.aborted ?? false,
				correctionsThisTurn: state.correctionsThisTurn,
				correctionsTurn: state.correctionsTurn
			})?.kind === "delivery") {
				yield chunk;
				continue;
			}
			yield {
				type: "finish",
				reason: {
					kind: "error",
					failure: {
						message: "GenUI turn completed with reasoning only and no deliverable response",
						code: EMPTY_RESPONSE_CODE
					}
				}
			};
		} else yield chunk;
	}
}
/** Text of one assistant message's text blocks, in order. */
function textOfContent(content) {
	if (!Array.isArray(content)) return "";
	return content.map((block) => {
		if (typeof block !== "object" || block === null) return "";
		const record = block;
		return record.type === "text" && typeof record.text === "string" ? record.text : "";
	}).filter((part) => part !== "").join("\n");
}
/** 读取 render_ui result protocol 中明确返回的 status。 */
function renderResultStatus(content) {
	const lines = textOfContent(content).split(/\r?\n/u);
	if (lines[0]?.trim() !== "[genui-render]") return void 0;
	for (const line of lines.slice(1)) {
		if (line === "status=rendered") return "rendered";
		if (line === "status=invalid") return "invalid";
	}
}
/** 从 legacy wrapper 与 Session format v4 中提取 tool result 数据。 */
function observedToolResult(message) {
	if (typeof message !== "object" || message === null) return null;
	const record = message;
	if (typeof record.toolCallId === "string") return {
		callId: record.toolCallId,
		isError: record.isError === true,
		content: record.content
	};
	if (!Array.isArray(record.content)) return null;
	const block = record.content.find((part) => typeof part === "object" && part !== null && part.type === "tool-result");
	if (typeof block?.toolCallId !== "string") return null;
	return {
		callId: block.toolCallId,
		isError: block.isError === true,
		content: block.content
	};
}
/** Tool whose SUCCESSFUL result is a formal delivery. */
const DELIVERY_TOOL = "render_ui";
/**
* Whether one assistant message delivered a non-empty body text.
*
* Deliberately narrow: a non-empty text block. A `render_ui` call is decided
* by its `tool/result`, not by the call appearing in a message — a call that
* failed (or whose result has not arrived) is not a delivery. Other tools
* (validate_dsh_ui, bash, …) may succeed without producing any answer, so
* they are NOT counted as delivery.
*
* @param content - assistant content blocks.
* @returns true when this message delivered a body text.
*/
function deliveredBodyText(content) {
	if (!Array.isArray(content)) return false;
	return content.some((block) => {
		if (typeof block !== "object" || block === null) return false;
		const record = block;
		return record.type === "text" && typeof record.text === "string" && record.text.trim() !== "";
	});
}
/** 分类当前与 legacy correction message 中的 marker。 */
function feedbackMarkersIn(text) {
	const renderFingerprints = [];
	const deliveryTurns = [];
	let cursor = 0;
	while (cursor < text.length) {
		const current = text.indexOf(MARKER_PREFIX, cursor);
		const legacy = text.indexOf(LEGACY_MARKER_PREFIX, cursor);
		if (current < 0 && legacy < 0) break;
		const useLegacy = legacy >= 0 && (current < 0 || legacy < current);
		const prefix = useLegacy ? LEGACY_MARKER_PREFIX : MARKER_PREFIX;
		const index = useLegacy ? legacy : current;
		const end = text.indexOf("]", index + prefix.length);
		if (end < 0) break;
		const marker = text.slice(index + prefix.length, end);
		const turn = /^turn-(\d+)$/u.exec(marker);
		if (turn !== null) deliveryTurns.push(Number(turn[1]));
		else renderFingerprints.push(marker);
		cursor = end + 1;
	}
	return {
		renderFingerprints,
		deliveryTurns
	};
}
/** 恢复一条持久化 correction 消耗的 turn budget。 */
function accountReplayedCorrection(state, turn) {
	if (state.correctionsTurn !== turn) {
		state.correctionsTurn = turn;
		state.correctionsThisTurn = 1;
		return;
	}
	state.correctionsThisTurn = Math.min(2, state.correctionsThisTurn + 1);
}
/** Identify this plugin's source across current and migrated session shapes. */
function isFeedbackSource(source) {
	return source?.kind === FEEDBACK_SOURCE_KIND || source?.kind === "plugin" && source.plugin === "@changfenhuang/dsh-genui";
}
/**
* 注册 GenUI 回合跟踪、宿主重试判定和可选的围栏修正流程。
*
* @param ctx - 宿主 Context。
* @param enabled - 是否启用同回合围栏修正。
* @param renderUiToolEnabled - 是否已注册 `render_ui` 工具。
*/
function installFenceFeedback(ctx, enabledInput, renderUiToolInput = true) {
	const isEnabled = typeof enabledInput === "function" ? enabledInput : () => enabledInput;
	const renderUiToolOn = typeof renderUiToolInput === "function" ? renderUiToolInput : () => renderUiToolInput;
	const sessions = /* @__PURE__ */ new Map();
	const stateOf = (sessionId) => {
		let state = sessions.get(sessionId);
		if (state === void 0) {
			state = {
				text: "",
				validatedThisTurn: false,
				isSubagent: false,
				deliveredThisTurn: false,
				pendingRenders: /* @__PURE__ */ new Set(),
				correctedSpec: /* @__PURE__ */ new Set(),
				deliveryRemindedTurns: /* @__PURE__ */ new Set(),
				correctionsThisTurn: 0,
				correctionsTurn: void 0,
				currentTurn: void 0,
				accountedCorrectionMessageIds: /* @__PURE__ */ new Set()
			};
			sessions.set(sessionId, state);
		}
		return state;
	};
	ctx.on("session/disposed", (session) => {
		sessions.delete(String(session.id));
	});
	const resetTurnState = (state, turn) => {
		state.text = "";
		state.validatedThisTurn = false;
		state.deliveredThisTurn = false;
		state.pendingRenders.clear();
		state.currentTurn = turn;
	};
	const observeEvent = (session, event) => {
		const sessionId = String(session.id);
		if (event.type === "turn/start") {
			const state = stateOf(sessionId);
			state.isSubagent = session.header.parentSession !== void 0;
			state.correctedSpec.clear();
			resetTurnState(state, event.data.turn);
			return;
		}
		if (event.type === "assistant/message") {
			const content = event.data.message?.content;
			const text = textOfContent(content);
			const state = stateOf(sessionId);
			state.isSubagent = session.header.parentSession !== void 0;
			state.text = extractDshUiFences(text).length > 0 ? text : "";
			state.deliveredThisTurn = state.deliveredThisTurn || deliveredBodyText(content);
			return;
		}
		if (event.type === "tool/call") {
			const data = event.data;
			const state = stateOf(sessionId);
			state.isSubagent = session.header.parentSession !== void 0;
			if (data.name === "validate_dsh_ui") state.validatedThisTurn = true;
			if (data.name === DELIVERY_TOOL && typeof data.callId === "string") state.pendingRenders.add(data.callId);
			return;
		}
		if (event.type === "tool/result") {
			const data = event.data;
			const result = observedToolResult(data.message);
			if (result === null) return;
			const state = stateOf(sessionId);
			state.isSubagent = session.header.parentSession !== void 0;
			if (!state.pendingRenders.delete(result.callId)) return;
			if (data.error === void 0 && result.isError !== true && renderResultStatus(result.content) === "rendered") state.deliveredThisTurn = true;
			return;
		}
		if (event.type !== "user/message") return;
		const data = event.data;
		if (isFeedbackSource(data.source)) {
			const markers = feedbackMarkersIn(textOfContent(data.content));
			if (markers.renderFingerprints.length === 0 && markers.deliveryTurns.length === 0) return;
			const state = stateOf(sessionId);
			state.isSubagent = session.header.parentSession !== void 0;
			for (const fingerprint of markers.renderFingerprints) state.correctedSpec.add(fingerprint);
			for (const turn of markers.deliveryTurns) state.deliveryRemindedTurns.add(turn);
			if (typeof data.id === "string" && !state.accountedCorrectionMessageIds.has(data.id)) {
				state.accountedCorrectionMessageIds.add(data.id);
				const turn = markers.deliveryTurns[0] ?? state.currentTurn;
				if (turn !== void 0) accountReplayedCorrection(state, turn);
			}
			return;
		}
		if (data.source?.kind !== "user") return;
		const state = sessions.get(sessionId);
		if (state !== void 0) {
			state.isSubagent = session.header.parentSession !== void 0;
			resetTurnState(state, state.currentTurn);
		}
	};
	const restoreHistory = (session) => {
		if (sessions.has(String(session.id))) return;
		for (const event of session.snapshotEvents()) observeEvent(session, event);
	};
	ctx.on("session/event", (session, event) => {
		restoreHistory(session);
		observeEvent(session, event);
	});
	ctx.on("session/created", restoreHistory);
	const restoreSessions = (sessionCtx) => {
		const store = sessionCtx.reflect.get("sessions");
		if (store === void 0) return;
		for (const session of store.list()) restoreHistory(session);
	};
	restoreSessions(ctx);
	ctx.inject(["sessions"], restoreSessions);
	ctx.on("llm/stream", (options, next) => {
		if (options.sessionId === void 0 || options.purpose !== void 0) return next();
		const state = sessions.get(String(options.sessionId));
		if (state?.validatedThisTurn !== true || state.isSubagent) return next();
		return retryReasoningOnlyGenuiStream(options, next(), state, isEnabled());
	}, { global: true });
	ctx.on("agent/turn-stopping", ({ agent, turn, signal }) => {
		if (!isEnabled()) return;
		if (agent.session.header.parentSession !== void 0) return;
		const state = sessions.get(String(agent.session.id));
		if (state === void 0) return;
		state.currentTurn = turn;
		if (state.pendingRenders.size > 0) return;
		const usedThisTurn = state.correctionsTurn === turn ? state.correctionsThisTurn : 0;
		const plan = planFenceFeedback({
			text: state.text,
			turn,
			correctedSpec: state.correctedSpec,
			deliveryRemindedTurns: state.deliveryRemindedTurns,
			validatedThisTurn: state.validatedThisTurn,
			deliveredThisTurn: state.deliveredThisTurn,
			aborted: signal.aborted,
			correctionsThisTurn: usedThisTurn,
			correctionsTurn: state.correctionsTurn,
			renderUiToolEnabled: renderUiToolOn()
		});
		if (plan === null) return;
		for (const fingerprint of plan.fingerprints) state.correctedSpec.add(fingerprint);
		if (plan.kind === "delivery") state.deliveryRemindedTurns.add(plan.turn);
		state.correctionsTurn = plan.turn;
		state.correctionsThisTurn = usedThisTurn + 1;
		try {
			const message = createFeedbackMessage(plan.text, agent.session.header.version);
			state.accountedCorrectionMessageIds.add(message.id);
			agent.steer(message);
		} catch (error) {
			ctx.logger?.warn?.(`dsh-genui: fence feedback steering failed (${error instanceof Error ? error.message : String(error)})`);
		}
	});
}
//#endregion
//#region src/shared/panel-merge.ts
/** If `spec` is a single root `tabs` node, its tabs; otherwise null. */
function asTabs(spec) {
	if (spec.items.length !== 1) return null;
	const only = spec.items[0];
	if (only?.type !== "tabs" || !Array.isArray(only.tabs)) return null;
	return only.tabs;
}
/**
* Merge an `append` spec into the current panel spec:
* - both sides single-tabs containers → merge BY TAB LABEL: items of
*   same-labelled tabs are appended, new labels are added (order preserved);
* - otherwise → plain item lists are appended to the tail.
* The previous title wins unless it was absent. `next` is returned as-is when
* there is nothing to merge into. Export for tests.
*/
function mergePanelSpecs(prev, next) {
	if (prev === null || prev.items.length === 0 && (prev.computed?.length ?? 0) === 0) return next;
	const title = prev.title ?? next.title;
	const computed = [...prev.computed ?? [], ...next.computed ?? []];
	const base = {
		...prev,
		...title === void 0 ? {} : { title },
		...computed.length === 0 ? {} : { computed }
	};
	const prevTabs = asTabs(prev);
	const nextTabs = asTabs(next);
	if (prevTabs !== null && nextTabs !== null) {
		const merged = new Map(prevTabs.map((t) => [t.label, {
			label: t.label,
			items: [...t.items]
		}]));
		for (const tab of nextTabs) {
			const existing = merged.get(tab.label);
			if (existing !== void 0) existing.items.push(...tab.items);
			else merged.set(tab.label, {
				label: tab.label,
				items: [...tab.items]
			});
		}
		return {
			...base,
			items: [{
				type: "tabs",
				tabs: [...merged.values()]
			}]
		};
	}
	return {
		...base,
		items: [...prev.items, ...next.items]
	};
}
//#endregion
//#region src/plugin/dsh-go-native.ts
const PANEL = "genui";
const RECORD = "plugin:dsh-genui/native-state";
const hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 24);
const object = (v) => typeof v === "object" && v !== null && !Array.isArray(v) ? v : void 0;
/** Ordered replay of committed results and closed fences; never pending tool args. */
function nativeDocument(events, sessionId) {
	let spec = null, panel = null, source = -1, panelIdentity = "", stateIdentity = "";
	const calls = /* @__PURE__ */ new Map();
	const accept = (raw, seq, fromTool = false) => {
		const result = processGenuiSpec(raw, { deferPanelReferences: true });
		if (!isRenderableProcess(result) || !result.spec) return;
		const next = result.spec;
		if (fromTool) {
			panel = next;
			panelIdentity = hash([
				sessionId,
				seq,
				next
			]);
			spec = panel;
			stateIdentity = panelIdentity;
		} else if (next.panel) {
			if (!next.append || panel === null) panelIdentity = hash([
				sessionId,
				seq,
				next
			]);
			panel = next.append ? mergePanelSpecs(panel, next) : next;
			spec = panel;
			stateIdentity = panelIdentity;
		} else {
			spec = next;
			stateIdentity = hash([
				sessionId,
				seq,
				next
			]);
		}
		source = seq;
	};
	for (const event of events) {
		if ("surfaceOp" in event && event.surfaceOp !== "append") continue;
		if (event.type === "tool/call") calls.set(event.data.callId, event.data.name);
		if (event.type === "tool/result" && !event.data.message.isError && calls.get(event.data.message.toolCallId) === "render_ui") accept(event.data.meta, event.seq, true);
		if (event.type !== "assistant/message" || event.data.interrupted) continue;
		for (const block of event.data.message.content) {
			if (block.type !== "text") continue;
			for (const fence of extractDshUiFences(block.text)) {
				if (!fence.closed) continue;
				try {
					accept(JSON.parse(fence.raw), event.seq);
				} catch {}
			}
		}
	}
	if (spec === null) return null;
	const checked = processGenuiSpec(spec);
	return {
		spec,
		source,
		generation: hash([
			sessionId,
			source,
			spec
		]),
		stateIdentity,
		valid: isRenderableProcess(checked) && !checked.warnings.some((w) => w.kind === "truncated")
	};
}
function stateFrom(value) {
	const v = object(value), fields = object(v?.fields), choices = object(v?.choices), tabs = object(v?.tabs), feedback = object(v?.feedback);
	if (!fields || !choices || !tabs || !feedback) return void 0;
	if (Object.values(feedback).some((v) => typeof v !== "string") || Object.values(fields).some((v) => typeof v !== "string") || Object.values(choices).some((v) => !Array.isArray(v) || v.some((x) => typeof x !== "string")) || Object.values(tabs).some((v) => !Number.isSafeInteger(v) || Number(v) < 0)) return void 0;
	return {
		fields: Object.assign(Object.create(null), fields),
		choices: Object.assign(Object.create(null), structuredClone(choices)),
		tabs: Object.assign(Object.create(null), tabs),
		feedback: Object.assign(Object.create(null), feedback)
	};
}
/** Initialize declared defaults once, before either painting or collecting state. */
function effectiveState(spec, saved = emptyNativeState()) {
	const checkboxDefaults = /* @__PURE__ */ new Map();
	walkGenuiNodes(spec, (node) => {
		if ((node.type === "radio" || node.type === "select") && node.selected !== void 0) {
			const key = node.type === "radio" ? node.group : node.id;
			const value = node.options[node.selected];
			if (key && value !== void 0 && !Object.hasOwn(saved.fields, key)) saved.fields[key] = value;
		}
		if (node.type === "checkbox" && node.group && node.checked) {
			const list = checkboxDefaults.get(node.group) ?? [];
			list.push(node.label);
			checkboxDefaults.set(node.group, list);
		}
	});
	for (const [key, values] of checkboxDefaults) if (!Object.hasOwn(saved.choices, key)) saved.choices[key] = values;
	return saved;
}
/** Native services are optional, late-bound, and owned by the plugin lifetime. */
function installDshGoNative(ctx) {
	ctx.inject(["dshGo", "systemPrompt"], (native) => {
		native.effect(() => native.systemPrompt.section({
			name: "genui:native",
			order: native.systemPrompt.getSectionOrder("STRUCTURED_OUTPUT"),
			text: "This host can also serve dsh-go; an installed bridge does NOT identify the active client. Preserve the full ordinary GenUI items spec and all web capabilities. When validate_dsh_ui returns native_fence_json, that exact JSON works in both clients; never hand-edit its derived children. If the user is using the native App, validate even small inline fences and use the GenUI native panel for local controls and exact callbacks. A missing native projection must never remove advanced content from the original spec or downgrade a web reply. Native [dsh-ui reply] carries only the visible title and choice; respond to that visible choice in context. Keep the existing [genui-action] payload protocol for panel actions. Explain native limitations only when relevant to the user’s current client."
		}), "dsh-genui: native guidance");
	});
	ctx.inject(["dshGo", "sessions"], (native) => {
		native.effect(async () => {
			const bridge = native.dshGo;
			const unavailable = () => bridge.panel(PANEL, { view: (_scope, caps) => ({
				type: "callout",
				tone: "info",
				text: caps.locale.startsWith("en") ? "Native panel state could not load. Check the plugin installation; web views and native cards still work." : "原生面板未能载入状态服务，请检查插件安装。网页版和原生卡片仍可使用。"
			}) });
			let api;
			try {
				api = await import("@deepseek-ai/dsh-session");
			} catch {
				return unavailable();
			}
			const { appendPluginRecord, pluginRecordOf } = api;
			if (typeof appendPluginRecord !== "function" || typeof pluginRecordOf !== "function") return bridge.panel(PANEL, { view: (_scope, caps) => ({
				type: "callout",
				tone: "info",
				text: caps.locale.startsWith("en") ? "Native panels require DSH 0.2.1-rc.2 or later. Web views and native cards still work." : "原生面板需要 DSH 0.2.1-rc.2 或更新版本。网页版和原生卡片仍可使用。"
			}) });
			const subscribers = /* @__PURE__ */ new Map();
			const sessions = native.reflect.get("sessions");
			const read = (scope) => scope.sessionId === void 0 ? void 0 : sessions.get(scope.sessionId);
			const saved = (session, document) => {
				const events = session.snapshotEvents();
				for (let i = events.length - 1; i >= 0; i--) {
					const record = pluginRecordOf(events[i]);
					if (record?.type !== RECORD) continue;
					const data = object(record.data);
					if (data?.document === document.stateIdentity) return effectiveState(document.spec, stateFrom(data.state));
				}
				return effectiveState(document.spec);
			};
			const info = (text) => ({
				type: "callout",
				tone: "info",
				text
			});
			const view = (scope, locale) => {
				const session = read(scope), en = locale.startsWith("en");
				if (!session) return info(en ? "Open GenUI from a loaded conversation." : "请在已加载的对话中打开 GenUI。");
				const document = nativeDocument(session.snapshotEvents(), session.id);
				if (!document) return info(en ? "No GenUI content in this conversation yet." : "这个对话还没有 GenUI 内容。");
				if (!document.valid) return info(en ? "This document is incomplete or exceeds the native limits." : "此内容结构尚未完整，或已超过原生容量。");
				const state = saved(session, document);
				const compiled = compileDshGo(document.spec, "panel", state, locale, hash([document.generation, state]));
				return fitsNativeView(compiled.view, "panel") ? compiled.view : info(en ? "This document exceeds the native panel limits. Its full content remains in the conversation." : "此内容超过原生面板容量，完整内容仍保留在对话中。");
			};
			const notify = (session) => {
				for (const emit of subscribers.get(session.id) ?? []) emit({ revision: session.snapshotEvents().length });
				bridge.refresh(PANEL, { sessionId: session.id });
			};
			const invoke = (scope, event) => {
				const en = event.locale.startsWith("en"), toast = (text) => [{
					type: "toast",
					text
				}];
				const session = read(scope);
				if (!session) return toast(en ? "Conversation is unavailable." : "对话尚未加载。");
				const document = nativeDocument(session.snapshotEvents(), session.id);
				if (!document || !document.valid) return toast(en ? "No usable GenUI content." : "暂无可操作的 GenUI 内容。");
				const state = saved(session, document);
				const compiled = compileDshGo(document.spec, "panel", state, event.locale, hash([document.generation, state]));
				const descriptor = compiled.actions.get(event.action ?? "");
				if (!descriptor || !fitsNativeView(compiled.view, "panel")) return toast(en ? "Outdated control. Reopen the panel." : "此控件已失效，请重新打开面板。");
				const { node, key, kind } = descriptor, value = object(event.value) ?? {};
				let modelAction, payload = {};
				if (kind === "reset" && node.type === "submit") {
					const registry = compileSubmissionRegistry(document.spec);
					const groups = node.groups ?? [...registry.members.keys()];
					for (const group of groups) {
						delete state.fields[group];
						delete state.choices[group];
					}
					delete state.feedback[key];
					modelAction = node.resetAction;
					payload = {
						type: "submit-reset",
						groups
					};
				} else if (kind === "tab" && node.type === "tabs") {
					const index = typeof value.value === "string" ? Number(value.value) : NaN;
					if (!Number.isSafeInteger(index) || index < 0 || index >= node.tabs.length) return toast(en ? "Invalid choice." : "选项无效。");
					state.tabs[key] = index;
				} else if (kind === "accordion" && node.type === "accordion") {
					if (!Array.isArray(value.values) || value.values.some((v) => typeof v !== "string" || !/^(0|[1-9]\d*)$/u.test(v) || Number(v) >= node.items.length)) return toast(en ? "Invalid choice." : "选项无效。");
					state.choices[key] = [...new Set(value.values)];
				} else switch (node.type) {
					case "select":
					case "radio": {
						if (typeof value.value !== "string" || !node.options.includes(value.value)) return toast(en ? "Invalid choice." : "选项无效。");
						const group = node.type === "select" ? node.id : node.group;
						state.fields[group ?? key] = value.value;
						if (group) state.feedback = Object.create(null);
						modelAction = node.type === "radio" && node.group ? void 0 : node.action;
						payload = {
							type: node.type,
							value: value.value,
							...node.type === "select" && node.id ? { id: node.id } : {}
						};
						break;
					}
					case "checkbox":
					case "switch": {
						if (typeof value.confirmed !== "boolean") return toast(en ? "Invalid choice." : "选项无效。");
						const group = node.type === "checkbox" ? node.group : void 0;
						const selected = new Set(state.choices[group ?? key] ?? []);
						const identity = node.type === "checkbox" ? node[GENUI_CHECKBOX_VALUE] ?? node.label : node.label;
						if (value.confirmed) selected.add(identity);
						else selected.delete(identity);
						state.choices[group ?? key] = [...selected];
						if (group) state.feedback = Object.create(null);
						modelAction = group ? void 0 : node.action;
						payload = {
							type: node.type,
							...node.type === "checkbox" ? { label: node.label } : {},
							checked: value.confirmed
						};
						break;
					}
					case "button":
						modelAction = node.action;
						payload = {
							type: "button",
							label: node.label
						};
						break;
					case "copy": return [{
						type: "copy",
						text: node.text
					}];
					case "link": return node.href ? [{
						type: "link",
						url: node.href
					}] : [];
					case "quiz": {
						const index = typeof value.value === "string" ? Number(value.value) : NaN;
						if (!Number.isSafeInteger(index) || index < 0 || index >= node.options.length) return toast(en ? "Invalid choice." : "选项无效。");
						state.choices[key] = [String(index)];
						break;
					}
					case "submit": {
						modelAction = node.action;
						const { resolved, answers, fields, collectedAnswers } = nativeSubmission(document.spec, state, node.groups);
						if (!resolved.total || resolved.answered !== resolved.total) return toast(en ? "Complete the required choices first." : "请先完成必选项。");
						if (resolved.localGradeEligible && (!resolved.hasOutOfScopePayload || !modelAction)) {
							const graded = resolved.scope.flatMap((member) => member.kind === "radio" && member.answer !== void 0 ? [member] : []);
							const lines = graded.map((member) => {
								const correct = typeof member.answer === "number" ? member.options[member.answer] : member.answer;
								return `${answers[member.key] === correct ? "✓" : "✗"} ${member.label}: ${answers[member.key]}${answers[member.key] === correct ? "" : ` → ${correct}`}\n${member.explanation ?? ""}`;
							});
							const score = graded.filter((member) => answers[member.key] === (typeof member.answer === "number" ? member.options[member.answer] : member.answer)).length;
							state.feedback[key] = `${score} / ${graded.length}\n${lines.join("\n")}`;
							modelAction = void 0;
						} else {
							payload = {
								type: "submit",
								answers: collectedAnswers,
								...Object.keys(fields).length ? { fields } : {},
								total: resolved.total,
								answered: resolved.answered
							};
							if (!modelAction) return toast(en ? "This submission has no model action." : "此提交未配置模型动作。");
						}
						break;
					}
					default: return toast(en ? "This control is unavailable." : "此控件暂不可用。");
				}
				if (modelAction) {
					const agent = native.get("agents")?.get(session.id);
					if (!agent || agent.session !== session || agent.status !== "idle" || agent.inbox.nextTurn.length || agent.inbox.nextStep.length) return toast(en ? "Wait until this conversation is ready." : "请等当前对话空闲后再操作。");
					agent.followup({
						id: randomUUID(),
						role: "user",
						content: [{
							type: "text",
							text: `[genui-action] ${modelAction} ${JSON.stringify(payload)}`
						}],
						source: { kind: "user" }
					});
				}
				appendPluginRecord(session, RECORD, {
					document: document.stateIdentity,
					state
				});
				return [{
					type: "refresh",
					id: PANEL
				}];
			};
			const disposePanel = bridge.panel(PANEL, {
				view: (scope, caps) => view(scope, caps.locale),
				data: (scope, emit) => {
					if (!scope.sessionId) return () => {};
					const set = subscribers.get(scope.sessionId) ?? /* @__PURE__ */ new Set();
					subscribers.set(scope.sessionId, set);
					set.add(emit);
					emit({ revision: read(scope)?.snapshotEvents().length ?? 0 });
					return () => {
						set.delete(emit);
						if (!set.size) subscribers.delete(scope.sessionId);
					};
				}
			});
			const disposeActions = bridge.on(PANEL, invoke);
			const disposeEvents = native.on("session/event", (session, event) => {
				if ([
					"assistant/message",
					"tool/result",
					RECORD
				].includes(event.type)) notify(session);
			});
			return () => {
				disposeEvents();
				disposeActions();
				disposePanel();
				subscribers.clear();
			};
		}, "dsh-genui: native panel");
	});
}
//#endregion
//#region src/shared/genui-config.ts
const DEFAULT_GENUI_CONFIG = Object.freeze({
	validation: "always",
	fenceFeedback: true,
	renderUiTool: false,
	html: Object.freeze({
		enabled: true,
		scripts: true,
		remote: false,
		maxHeight: 2400
	}),
	exportAnswer: true
});
const SECTIONS = [
	"validation",
	"fenceFeedback",
	"renderUiTool",
	"html",
	"exportAnswer"
];
const d$1 = DEFAULT_GENUI_CONFIG;
const read = (value) => value !== null && typeof value === "object" && typeof value.get === "function" ? value.get() : value;
const bool = (value, fallback) => typeof value === "boolean" ? value : fallback;
/**
* Resolve the row's config (volatile references or plain values, possibly
* partial or absent) into a complete, detached settings object.
*/
function snapshotGenuiConfig(raw) {
	const source = raw !== null && typeof raw === "object" ? raw : {};
	const out = {};
	for (const key of SECTIONS) out[key] = read(source[key]);
	const validation = out.validation === "uncertain" || out.validation === "skip" || out.validation === "always" ? out.validation : d$1.validation;
	const html = out.html !== null && typeof out.html === "object" ? out.html : {};
	const maxHeight = typeof html.maxHeight === "number" && Number.isFinite(html.maxHeight) ? Math.min(1e4, Math.max(200, Math.round(html.maxHeight))) : d$1.html.maxHeight;
	return {
		validation,
		fenceFeedback: bool(out.fenceFeedback, d$1.fenceFeedback),
		renderUiTool: bool(out.renderUiTool, d$1.renderUiTool),
		html: {
			enabled: bool(html.enabled, d$1.html.enabled),
			scripts: bool(html.scripts, d$1.html.scripts),
			remote: bool(html.remote, d$1.html.remote),
			maxHeight
		},
		exportAnswer: bool(out.exportAnswer, d$1.exportAnswer)
	};
}
//#endregion
//#region src/plugin/prompt.ts
const RENDER_UI_TOOL_GUIDANCE = "- Tool channel: render_ui 工具把同一 spec 渲染为工具行卡片；围栏用于回答内联 UI。";
const INTRO = `Render UI inside your reply with a fenced \`dsh-ui\` JSON block:

\`\`\`dsh-ui
{"title":"示例","gap":14,"items":[{"type":"text","content":"把这里换成你的组件"}]}
\`\`\`

Allowed \`type\` values (one-line roles below). Before writing a fence, call \`genui_docs\` with the components (and topics) you chose to read their fields and examples — only ones not read earlier in this conversation; the \`genui\` skill holds the layout rules:

- 布局: text 文字 · row/col 横排/竖排 · grid 网格（子节点 span 宽窄混排） · card 卡片 · carousel 横向轮播 · divider 分隔（可带章节名） · spacer 留白 · hero 封面块（一条回答最多一个）
- 展示: badge 标签 · stat 指标 · progress 进度条/环 · list 列表 · table 表格（排序/筛选/行明细） · keyvalue 键值 · timeline 时间线 · file-tree 目录树 · breadcrumb 路径 · callout 提示框 · steps 步骤 · diff 代码改动 · json · code · copy 可复制文本 · avatar 头像 · image 图片 · image-group 图集 · compare 前后对比（改动汇报优先） · audio · video · icon 图标 · blocks 色块矩阵 · arrow 连接箭头
- 图表: chart {"kind":"bars|line|donut","data":[{"label":"...","value":n}]}（series：bars 分组/堆叠 / line 多序列） · echart ECharts（雷达/漏斗/热力/桑基等 preset 或 option 直通） · plot 函数图 · svg 单图预览
- 交互: button 按钮 · input · textarea · editor 文本编辑 · select · date-picker 日期/区间 · segmented-control 分段选择 · checkbox · switch · slider · radio · submit 提交/交卷 · quiz 测验 · choices 带代价的方案选择 · link · tabs 标签页 · accordion 折叠 · popover 浮层说明
- 高级: mermaid 流程/时序/甘特/ER · diagram 架构/流程图 · scene3d 3D 场景 · entity-card 实体卡 · map 地点地图`;
const JUDGMENT = `**默认写 Markdown，不写 dsh-ui。** 会议纪要、总结、报告、说明、教程、邮件、方案、清单这类以文字为主的回答，再长也用标题、列表、加粗和 Markdown 表格；篇幅长、要点多、想显得好看都不是用组件的理由。只有这几种情况才出组件：读者要操作（作答判卷、填选、做决定、筛选数据）；数值要看形状（趋势/占比/分布）；结构或流程画成图明显更清楚；图片前后对照；用户明确要可视化、仪表盘、卡片或页面。

**先问一句：删掉这个组件，读者会不会更费劲。** 会才出；不会就写正文。

- 没有配额：不存在"≥3 条要点就出 list"之类规则；组件只放承载不同信息的那一块，其余仍写正文，同一批信息不在正文和组件里各说一遍。
- 有比较/取舍要读者选 → \`choices\`；有数值趋势 → \`chart\`；有前后两种形态 → \`compare\`；有结构或流程 → \`diagram\`/\`mermaid\`。
- 组件内文字：支持公式、\`code\`、加粗、高亮、链接；组件字段里不写 Markdown table 与 fenced code，改用 table/code/diff/json。
- 配色跟随主题，语义需要时才用 \`palette\`/\`card.accent\`；grid 子节点用 \`"span":2\` 做宽窄混排；数据多时给 \`table\`/\`list\` 配 \`input\`(id)+\`filter\`。`;
const FIELDS = `**节点规则：** 组件节点必须带字符串 \`type\`，值为组件名；\`file-tree.items[].type\` 表示 \`file\` 或 \`dir\`。`;
const THEME = `**主题：** 根级 \`theme\`（强调色/圆角/疏密/字体/表面/背景/色板/阴影）与任意节点 \`style\` 可定制风格；只在用户要特定风格或语义需要时用，字段读 \`genui_docs\` 的 \`theme\`。`;
function misnamedFields(validation) {
	return `**字段名写错 = 该组件被丢弃**（其余组件照常渲染）：\`callout\` 正文是 \`content\` 不是 text/desc；\`table\` 要 \`columns\`+\`rows\` 不是 items；\`keyvalue\` 记录是 \`{key,value}\` 不是 \`{label,value}\`；\`file-tree\` 记录是 \`{name,type}\` 不是 \`{label}\`；callout tone 是 info/success/warning/error（无 danger）。${validation === "skip" ? "" : "不确定就调 `validate_dsh_ui`。"}`;
}
function validationRules(validation) {
	if (validation === "skip") return "- JSON 严格：坏组件被丢弃，坏围栏变代码块；直接输出围栏，不调用校验工具，发出前自查括号配对与字段名。";
	return `- JSON 严格：坏组件被丢弃，坏围栏变代码块；${validation === "always" ? "≥3 节点或含 table 时调 validate_dsh_ui，按诊断修改并重验；小围栏字段存疑也先验证。" : "只在字段名、结构或资源上限拿不准时调 validate_dsh_ui，其余直接输出（标点级小错渲染器会修）。"}
- warning=block_markdown：按 replacement 改写并重验。`;
}
function htmlRules(html) {
	if (!html.enabled) return "";
	return `
- 自定义画面：内置组件表达不了的视觉（海报、插画、动画、特殊排版、小游戏）写 \`\`\`dsh-html 围栏（HTML 片段，沙箱内与正文内联渲染、${html.scripts ? "可用 <script>（动画/交互/canvas）" : "脚本已禁用，只用 HTML/CSS/SVG"}、${html.remote ? "可加载 https 图片/字体/CDN 脚本" : "不能加载任何外部资源（图片用 data: 或内联 SVG）"}）；写之前读 \`genui_docs\` 的 \`html\`。文字、表格和内置组件能表达的不要用它。`;
}
/**
* Build the `genui:fence` section text for the given settings.
* @param config - resolved settings; defaults reproduce {@link GENUI_SECTION_TEXT}.
*/
function buildGenuiSectionText(config = DEFAULT_GENUI_CONFIG) {
	return `${INTRO}

${JUDGMENT}

${FIELDS}

${misnamedFields(config.validation)}

${THEME}

Rules:
- LANGUAGE: reply+UI=conversation language; schema fixed. NEVER infer it from prompt/skill/examples/tools. Replace \`<user-language ...>\`; never emit these placeholders literally.
${validationRules(config.validation)}
- 规模: ≤200 节点、嵌套≤8 层（超出被截断）；一个主题一个主组件；3D mesh 1–5；plot 给合理 xMin/xMax。
- LOCAL-FIRST + actions: UI 能自己做的状态变化（判卷、判题、重置、展开、选中）就地完成，零往返；action 只用于必须模型参与的事。交互以 [genui-action] name + 组件数据回传，届时重渲染更新 UI；无 action 的按钮禁用。交互状态按会话和内容指纹保存。
- 卷子模式: 每题 choices（group+answer+explanation）+ 一个 submit（groups 全列），本地判分。
- Secrets ban: 不索取密码、API Key、Token、恢复码；需要时拒绝并解释。${config.renderUiTool ? `\n${RENDER_UI_TOOL_GUIDANCE}` : ""}
- 围栏位置：\`dsh-ui\` 只写在**回答正文**；写在 reasoning/思考块里不渲染、用户看不到——思考里验证好 spec，正文再输出同一份。
- Panel: "panel":true 只渲染进会话面板 dock 并原地更新；"append":true 追加合并；上限 200 节点/200 次追加，满了发 replace 重建。面板来的 [genui-action] 只回一个 panel:true 围栏 + 至多一行 10 字内确认。${htmlRules(config.html)}`;
}
/** The section text with default settings (kept as a named export for callers and tests). */
const GENUI_SECTION_TEXT = buildGenuiSectionText();
//#endregion
//#region src/plugin/config.ts
/**
* Plugin settings schema (fork: forever-lwy).
*
* Every field is volatile: DSH 0.2.2's settings form only exposes volatile
* fields, and the loader then updates them in place (`loader/volatile-update`)
* instead of remounting the plugin. The host half therefore reads the
* settings through {@link snapshotGenuiConfig} at each use; the browser half
* reads the same row through `configForms`.
* @module @forever-lwy/dsh-genui/plugin/config
*/
const d = DEFAULT_GENUI_CONFIG;
const Config = z.object({
	validation: z.union([
		"always",
		"uncertain",
		"skip"
	]).default(d.validation).volatile().description("生成 UI 前的校验：always 复杂围栏先调 validate_dsh_ui / uncertain 只在拿不准时校验 / skip 跳过校验并不注册校验工具"),
	fenceFeedback: z.boolean().default(d.fenceFeedback).volatile().description("最终围栏无法渲染时，在同一回合请求模型发送一次修正版"),
	renderUiTool: z.boolean().default(d.renderUiTool).volatile().description("注册 render_ui 工具（渲染为独立的工具卡片；关闭后只用正文内联围栏）"),
	html: z.object({
		enabled: z.boolean().default(d.html.enabled).description("允许 ```dsh-html 自定义画面（沙箱 iframe，内联在回答中）"),
		scripts: z.boolean().default(d.html.scripts).description("允许画面中的脚本（动画、交互、canvas）"),
		remote: z.boolean().default(d.html.remote).description("允许加载 https 外部资源（图片、字体、CDN 脚本）"),
		maxHeight: z.natural().min(200).max(1e4).default(d.html.maxHeight).description("画面自适应高度上限（像素）")
	}).volatile().description("自定义 HTML 画面"),
	exportAnswer: z.boolean().default(d.exportAnswer).volatile().description("在回答操作栏显示“导出回答”按钮（保留渲染效果的 HTML）")
});
//#endregion
//#region src/plugin/skill-content.ts
/** An innermost block: its body holds no further `genui:if`. */
const BLOCK = /<!-- genui:if ([a-z]+)=([a-z|]+) -->\n?((?:(?!<!-- genui:if )[\s\S])*?)<!-- genui:end -->\n?/gu;
function valueOf(key, config) {
	switch (key) {
		case "validation": return config.validation;
		case "html": return config.html.enabled ? "on" : "off";
		case "scripts": return config.html.enabled && config.html.scripts ? "on" : "off";
		case "remote": return config.html.enabled && config.html.remote ? "on" : "off";
		default: return;
	}
}
/**
* Keep the blocks whose condition matches the settings and drop the rest.
* An unknown key keeps its block (a typo must not silently delete guidance).
*/
function adaptSkillContent(content, config) {
	let current = content;
	for (let pass = 0; pass < 8; pass++) {
		const next = current.replace(BLOCK, (_match, key, values, body) => {
			const actual = valueOf(key, config);
			if (actual === void 0) return body;
			return values.split("|").includes(actual) ? body : "";
		});
		if (next === current) break;
		current = next;
	}
	return current;
}
//#endregion
//#region src/plugin/docs.ts
/**
* `genui_docs`: on-demand GenUI reference (fork: forever-lwy).
*
* The always-present prompt lists what exists; the `genui` skill carries the
* judgment and layout rules; component fields, variants, limits and examples
* live in `reference/components.md` and `reference/topics.md` and reach the
* model only for the components and topics it decided to use. Sections are
* `## key / alias` headings. Returned text passes through the same
* settings filter as the skill (`<!-- genui:if … -->` blocks).
* @module @forever-lwy/dsh-genui/plugin/docs
*/
/** Package root: lib/index.js → .., src/plugin/docs.ts → ../.. */
function packageRoot() {
	const directory = dirname(fileURLToPath(new URL(import.meta.url)));
	return basename(directory) === "plugin" ? resolve(directory, "../..") : resolve(directory, "..");
}
/** Split a reference file into `## key / alias` sections. */
function parseSections(markdown, kind) {
	const sections = [];
	const parts = markdown.split(/^## /mu).slice(1);
	for (const part of parts) {
		const newline = part.indexOf("\n");
		const names = (newline < 0 ? part : part.slice(0, newline)).trim().split("/").map((name) => name.trim()).filter(Boolean);
		if (names.length === 0) continue;
		sections.push({
			key: names.join(" / "),
			kind,
			text: `## ${part.trimEnd()}`
		});
	}
	return sections;
}
/** Read and index the reference files once. */
function loadDocIndex(root = packageRoot()) {
	const sections = /* @__PURE__ */ new Map();
	const components = [];
	const topics = [];
	const register = (section) => {
		const names = section.key.split(" / ");
		for (const name of names) sections.set(name.toLowerCase(), section);
		(section.kind === "component" ? components : topics).push(names[0]);
	};
	for (const section of parseSections(readFileSync(resolve(root, "reference/components.md"), "utf8"), "component")) register(section);
	for (const section of parseSections(readFileSync(resolve(root, "reference/topics.md"), "utf8"), "topic")) register(section);
	try {
		register({
			key: "icon-names",
			kind: "topic",
			text: `## icon-names\n\n${readFileSync(resolve(root, "ICON-NAMES.md"), "utf8").trim()}`
		});
	} catch {}
	return {
		sections,
		components,
		topics
	};
}
/** Per-call cap on requested keys: a large ask is a sign of reading "everything". */
const MAX_ITEMS = 16;
function namesOf(args) {
	const record = args !== null && typeof args === "object" ? args : {};
	const raw = record.items ?? record.item ?? record.names;
	const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[\s,，、]+/u) : [];
	return [...new Set(list.filter((item) => typeof item === "string").map((item) => item.trim().toLowerCase()).filter(Boolean))];
}
/** Answer one request: the sections asked for, filtered by settings, plus what was not found. */
function answerDocs(index, config, args) {
	const names = namesOf(args);
	const available = `components: ${index.components.join(", ")}\ntopics: ${index.topics.filter((topic) => config.html.enabled || topic !== "html").join(", ")}`;
	if (names.length === 0) return `[genui-docs] error=missing_items\nPass items, e.g. {"items":["table","chart"]}.\n${available}`;
	const picked = [];
	const unknown = [];
	for (const name of names.slice(0, MAX_ITEMS)) {
		const section = index.sections.get(name);
		if (section === void 0 || section.key === "html" && !config.html.enabled) unknown.push(name);
		else if (!picked.includes(section)) picked.push(section);
	}
	const parts = picked.map((section) => adaptSkillContent(section.text, config).trim());
	const notes = [];
	if (names.length > MAX_ITEMS) notes.push(`only the first ${MAX_ITEMS} items were read; ask again for the rest`);
	if (unknown.length > 0) notes.push(`unknown=${unknown.join(",")}\n${available}`);
	return [
		`[genui-docs] ${picked.map((section) => section.key.split(" / ")[0]).join(", ") || "none"}`,
		...parts,
		...notes
	].join("\n\n");
}
const DESCRIPTION = "GenUI reference on demand: fields, variants, limits and examples for the dsh-ui components and topics you are about to use. Call it once you have decided which components a reply needs (only for ones not read earlier in this conversation), then write the fence. items: component type names (e.g. \"table\", \"chart\", \"choices\", \"diagram\") and/or topics: layouts, theme, html, interaction, when, computed, rich-text, local-files, icon-names.";
const PARAMETERS = {
	type: "object",
	properties: { items: {
		type: "array",
		items: { type: "string" },
		minItems: 1,
		maxItems: MAX_ITEMS,
		description: "Component type names and/or topic names to read."
	} },
	required: ["items"],
	additionalProperties: false
};
/** Build the tool; the index is read lazily on the first call. */
function createGenuiDocsTool(config, load = loadDocIndex) {
	let index;
	return {
		name: "genui_docs",
		description: DESCRIPTION,
		parameters: PARAMETERS,
		output: {
			schema: {
				type: "string",
				description: "The requested reference sections."
			},
			render(_args, value) {
				return [{
					type: "text",
					text: String(value)
				}];
			}
		},
		async execute(args) {
			index ??= load();
			return answerDocs(index, config(), args);
		}
	};
}
//#endregion
//#region src/plugin/index.ts
/**
* The mermaid/three engines ship as standalone IIFE bundles under
* `lib/assets/` and are fetched by the client ONLY when a spec needs them.
* This route serves them from the plugin's own package directory through the
* host webserver service — the longest-prefix rule lets it win over the
* generic `/plugins` bundle route, and no host source change is needed. The
* service is optional at this plugin's start time, so a dependency fiber owns
* the registration and follows the webserver through late binding, replacement,
* and plugin reloads.
*/
/** Route prefix under /plugins; anything under it is this plugin's asset. */
const ASSET_ROUTE_PATH = "/plugins/@forever-lwy/dsh-genui/assets";
/** Safe flat file names only: no slashes, no traversal, js assets only. */
const ASSET_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.js$/;
/** The handler itself (registered via the optional webServer probe). */
async function serveGenuiAsset(req, res) {
	if (req.method !== "GET" && req.method !== "HEAD") {
		res.writeHead(405);
		res.end();
		return;
	}
	let pathname;
	try {
		pathname = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
	} catch {
		res.writeHead(400);
		res.end();
		return;
	}
	const rel = pathname.startsWith(`${ASSET_ROUTE_PATH}/`) ? pathname.slice(38) : null;
	if (rel === null) {
		res.writeHead(404);
		res.end();
		return;
	}
	const file = rel.slice(1);
	if (!ASSET_FILE_RE.test(file)) {
		res.writeHead(404);
		res.end();
		return;
	}
	try {
		const dir = fileURLToPath(new URL("./assets/", import.meta.url));
		const body = await readFile(join(dir, file));
		res.writeHead(200, {
			"content-type": "text/javascript; charset=utf-8",
			"cache-control": "no-cache"
		});
		res.end(body);
	} catch {
		res.writeHead(404);
		res.end();
	}
}
/**
* Register the GenUI output-language section and the render_ui tool.
* @param ctx - cordis context.
*/
const name = "@changfenhuang/dsh-genui";
const inject = ["systemPrompt"];
const BUNDLED_SKILL_RANK = 600;
const BUNDLED_SKILL_PROVIDER = "dsh-genui";
const BUNDLED_SKILL_INVOCATION = {
	modelInvocable: true,
	userInvocable: true
};
/**
* The frontmatter field the routing description comes from.
*
* A second copy of this sentence in code drifted from SKILL.md unnoticed, and the
* panel showed the code copy while the model read the same string — so an edit to
* the skill's own frontmatter changed nothing. The file is the only source.
*/
function frontmatterField(front, key) {
	return new RegExp("^\\s*" + key + "\\s*:\\s*(.+?)\\s*$", "mu").exec(front)?.[1]?.replace(/^['"]|['"]$/gu, "");
}
/** Register through the provider path so source=bundled also gets bundled precedence. */
function bundledSkillProvider(config) {
	const moduleDirectory = dirname(fileURLToPath(new URL(import.meta.url)));
	const path = basename(moduleDirectory) === "plugin" ? resolve(moduleDirectory, "../../SKILL.md") : resolve(moduleDirectory, "../SKILL.md");
	const raw = readFileSync(path, "utf8");
	const end = raw.indexOf("\n---\n", 4);
	if (!raw.startsWith("---\n") || end < 0) throw new Error("genui SKILL.md has invalid frontmatter");
	const description = frontmatterField(raw.slice(4, end), "description");
	if (description === void 0) throw new Error("genui SKILL.md frontmatter has no description");
	return {
		name: BUNDLED_SKILL_PROVIDER,
		list: () => Promise.resolve([{
			name: "genui",
			description,
			invocation: BUNDLED_SKILL_INVOCATION,
			source: "bundled",
			provider: BUNDLED_SKILL_PROVIDER,
			path,
			resourceBase: {
				kind: "directory",
				path: dirname(path)
			},
			rank: BUNDLED_SKILL_RANK,
			locator: path
		}]),
		get: () => Promise.resolve({
			name: "genui",
			description,
			invocation: BUNDLED_SKILL_INVOCATION,
			source: "bundled",
			provider: BUNDLED_SKILL_PROVIDER,
			path,
			resourceBase: {
				kind: "directory",
				path: dirname(path)
			},
			content: adaptSkillContent(raw.slice(end + 5), config())
		})
	};
}
function apply(ctx, input) {
	installDshGoNative(ctx);
	let config = snapshotGenuiConfig(input);
	ctx.systemPrompt.section({
		name: "genui:fence",
		order: ctx.systemPrompt.getSectionOrder("STRUCTURED_OUTPUT"),
		text: () => buildGenuiSectionText(config)
	});
	installFenceFeedback(ctx, () => config.fenceFeedback, () => config.renderUiTool);
	const docsTool = createGenuiDocsTool(() => config);
	let toolsCtx;
	let disposeTools = () => {};
	let registered = "";
	const syncTools = () => {
		const scope = toolsCtx;
		const wanted = `${config.renderUiTool}:${config.validation !== "skip"}`;
		if (scope === void 0 || wanted === registered) return;
		disposeTools();
		const disposers = [];
		if (config.renderUiTool) disposers.push(scope.tools.register(createRenderUiTool()));
		if (config.validation !== "skip") disposers.push(scope.tools.register(createValidateDshUiTool()));
		disposers.push(scope.tools.register(docsTool));
		registered = wanted;
		disposeTools = () => {
			for (const dispose of disposers.splice(0)) dispose();
			registered = "";
		};
	};
	ctx.inject(["tools"], (scope) => {
		toolsCtx = scope;
		syncTools();
		scope.effect(() => () => {
			disposeTools();
			disposeTools = () => {};
			toolsCtx = void 0;
		}, "dsh-genui: model tools");
	});
	ctx.on("loader/volatile-update", (() => {
		config = snapshotGenuiConfig(input);
		syncTools();
	}));
	ctx.inject(["skills"], (skillCtx) => {
		skillCtx.skills.registerProvider(() => bundledSkillProvider(() => config));
	});
	ctx.inject(["webServer"], (webCtx) => {
		const webServer = webCtx.reflect.get("webServer");
		webCtx.effect(() => webServer.register({
			kind: "prefix",
			path: ASSET_ROUTE_PATH,
			handler: serveGenuiAsset
		}), "dsh-genui: asset route");
	});
}
//#endregion
export { Config, GENUI_SECTION_TEXT, apply, buildGenuiSectionText, inject, name };
