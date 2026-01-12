/// <reference types="@testing-library/jest-dom" />
import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {
    toBeInTheDocument(): T;
    toHaveTextContent(text: string | RegExp): T;
    toBeVisible(): T;
    toBeDisabled(): T;
    toHaveAttribute(attr: string, value?: string): T;
    toHaveClass(className: string): T;
    toHaveStyle(style: Record<string, unknown>): T;
    toHaveFocus(): T;
    toBeChecked(): T;
    toBeEmpty(): T;
    toContainElement(element: HTMLElement | null): T;
  }
}
