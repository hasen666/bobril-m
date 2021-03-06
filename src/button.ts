import * as b from "bobril";
import * as paper from "./paper";
import * as ripple from "./ripple";
import * as styles from "./styles";
import * as colors from "./colors";
import * as c from "./styleConsts";

export const enum Feature {
    /** ButtonType.Floating does not have Default style so Primary is used instead */
    Default,
    Primary,
    Secondary
}

export const enum ButtonType {
    Flat,
    Raised,
    Floating
}

export interface IButtonData {
    children?: b.IBobrilChildren;
    action?: () => void;
    type?: ButtonType;
    disabled?: boolean;
    feature?: Feature;
    tabindex?: number;
    icon?: b.IBobrilNode;
}

interface IButtonCtx extends b.IBobrilCtx {
    data: IButtonData;
    onScroll: () => void;
    pointerDown: () => void;
    focusFromKeyboard: boolean;
    down: boolean;
    hover: boolean;
    wasScroll: boolean;
}

let enabledStyle = b.styleDef(
    [
        c.userSelectNone,
        {
            overflow: "hidden",
            cursor: "pointer"
        }
    ],
    { focus: { outline: "none" } }
);

let disabledStyle = b.styleDef([
    c.userSelectNone,
    {
        overflow: "hidden",
        cursor: "default"
    }
]);

const enum FeatureWithDisabled {
    Default,
    Primary,
    Secondary,
    Disabled
}

let flatStyle = b.styleDef({
    display: "inline-block",
    textTransform: "uppercase",
    minWidth: 64,
    textAlign: "center",
    fontSize: "14px",
    fontWeight: 500
});

let flatButtonStyles = [
    b.styleDef({
        // Default
        backgroundColor: colors.transparent,
        color: styles.textColor
    }),
    b.styleDef({
        // Primary
        backgroundColor: colors.transparent,
        color: styles.accent1Color
    }),
    b.styleDef({
        // Secondary
        backgroundColor: colors.transparent,
        color: styles.primary1Color
    }),
    b.styleDef({
        // Disabled
        backgroundColor: colors.transparent,
        color: styles.disabledColor
    })
];

let raisedStyle = b.styleDef({
    display: "inline-block",
    textTransform: "uppercase",
    minWidth: 64,
    textAlign: "center",
    fontSize: "14px",
    fontWeight: 500
});

let raisedButtonStyles = [
    b.styleDef({
        // Default
        backgroundColor: styles.alternateTextColor,
        color: styles.textColor
    }),
    b.styleDef({
        // Primary
        backgroundColor: styles.accent1Color,
        color: styles.alternateTextColor
    }),
    b.styleDef({
        // Secondary
        backgroundColor: styles.primary1Color,
        color: styles.alternateTextColor
    }),
    b.styleDef({
        // Disabled
        backgroundColor: styles.alternateDisabledColor,
        color: styles.disabledColor
    })
];

let floatingStyle = b.styleDef([
    c.circle,
    {
        display: "inline-block",
        width: 56,
        height: 56
    }
]);

let floatingButtonStyles = [
    false, // no default
    b.styleDef({
        // Primary
        backgroundColor: styles.accent1Color,
        color: styles.alternateTextColor
    }),
    b.styleDef({
        // Secondary
        backgroundColor: styles.primary1Color,
        color: styles.alternateTextColor
    }),
    b.styleDef({
        // Disabled
        backgroundColor: styles.borderColor,
        color: styles.alternateTextColor
    })
];

export const Button = b.createComponent<IButtonData>({
    id: "Button",
    init(ctx: IButtonCtx) {
        ctx.focusFromKeyboard = false;
        ctx.down = false;
        ctx.onScroll = () => {
            ctx.wasScroll = true;
        };
        ctx.pointerDown = () => {
            if (ctx.data.disabled) return;
            ctx.focusFromKeyboard = false;
            if (b.pointersDownCount() === 1) {
                ctx.down = true;
                b.registerMouseOwner(ctx);
                b.focus(ctx.me);
                b.addOnScroll(ctx.onScroll);
                ctx.wasScroll = false;
            }
            b.invalidate(ctx);
        };
    },
    render(ctx: IButtonCtx, me: b.IBobrilNode) {
        let d = ctx.data;
        let showHover = (ctx.hover || ctx.focusFromKeyboard) && !d.disabled;
        let type = d.type || ButtonType.Flat;
        let trueChildren = d.children;
        if (type === ButtonType.Floating) {
            trueChildren = b.styledDiv(d.icon, {
                padding: 8,
                color: styles.strAlternateTextColor
            });
        }
        me.children = ripple.Ripple(
            {
                pulse:
                    type < ButtonType.Floating &&
                    ctx.focusFromKeyboard &&
                    !d.disabled,
                pointerDown: ctx.pointerDown,
                disabled: d.disabled,
                style: [
                    {
                        padding: 8,
                        backgroundColor: showHover
                            ? ctx.focusFromKeyboard
                                ? styles.keyboardFocusColor
                                : styles.hoverColor
                            : undefined
                    }
                ]
            },
            trueChildren
        );
        b.style(me, paper.paperStyle);
        b.style(me, d.disabled ? disabledStyle : enabledStyle);
        let featD = <FeatureWithDisabled>(
            (<number>(d.feature || Feature.Default))
        );
        if (d.disabled) featD = FeatureWithDisabled.Disabled;
        switch (type) {
            case ButtonType.Flat:
                b.style(
                    me,
                    flatStyle,
                    paper.roundStyle,
                    flatButtonStyles[featD]
                );
                break;
            case ButtonType.Raised:
                b.style(
                    me,
                    raisedStyle,
                    paper.roundStyle,
                    raisedButtonStyles[featD]
                );
                if (!d.disabled) {
                    let zOrder = 1;
                    if (ctx.down !== ctx.focusFromKeyboard) zOrder++;
                    b.style(me, styles.zDepthShadows[zOrder - 1]);
                }
                break;
            case ButtonType.Floating:
                if (featD === FeatureWithDisabled.Default)
                    featD = FeatureWithDisabled.Primary;
                b.style(me, floatingStyle, floatingButtonStyles[featD]);
                if (!d.disabled) {
                    let zOrder = 2;
                    if (ctx.down !== ctx.focusFromKeyboard) zOrder++;
                    b.style(me, styles.zDepthShadows[zOrder - 1]);
                }
                break;
        }
        me.attrs = {
            role: "button",
            "aria-disabled": d.disabled ? "true" : "false",
            tabindex: d.disabled ? undefined : d.tabindex || 0
        };
    },
    onPointerUp(ctx: IButtonCtx, ev: b.IBobrilPointerEvent): b.EventResult {
        const wasDown = ctx.down;
        b.invalidate(ctx);
        if (wasDown) {
            ctx.down = false;
            b.releaseMouseOwner();
            b.removeOnScroll(ctx.onScroll);
            if (
                !ctx.wasScroll &&
                b.pointersDownCount() === 0 &&
                !ctx.data.disabled &&
                ev.cancelable != false
            ) {
                let a = ctx.data.action;
                if (a) a();
                return b.EventResult.HandledPreventDefault;
            }
        }
        return b.EventResult.HandledButRunDefault;
    },
    onKeyDown(ctx: IButtonCtx, ev: b.IKeyDownUpEvent): boolean {
        if (ev.which === 32 && !ctx.data.disabled && ctx.focusFromKeyboard) {
            ctx.down = true;
            b.invalidate(ctx);
            return true;
        }
        if (ev.which === 13 && !ctx.data.disabled && ctx.focusFromKeyboard) {
            let a = ctx.data.action;
            if (a) a();
            return true;
        }
        return false;
    },
    onKeyUp(ctx: IButtonCtx, ev: b.IKeyDownUpEvent): boolean {
        if (ev.which === 32 && !ctx.data.disabled && ctx.focusFromKeyboard) {
            ctx.down = false;
            b.invalidate(ctx);
            let a = ctx.data.action;
            if (a) a();
            return true;
        }
        return false;
    },
    onMouseEnter(ctx: IButtonCtx) {
        ctx.hover = true;
        b.invalidate(ctx);
    },
    onMouseLeave(ctx: IButtonCtx) {
        ctx.hover = false;
        b.invalidate(ctx);
    },
    onFocus(ctx: IButtonCtx) {
        if (!ctx.down) {
            ctx.focusFromKeyboard = true;
            b.invalidate(ctx);
        }
    },
    onBlur(ctx: IButtonCtx) {
        ctx.focusFromKeyboard = false;
        b.invalidate(ctx);
    }
});
