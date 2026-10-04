import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

type AsyncComponent = (props: unknown) => Promise<ReactNode>;

function isAsyncComponent(type: unknown): type is AsyncComponent {
  return typeof type === "function" && type.constructor.name === "AsyncFunction";
}

// jsdom renders with client React, which cannot await an async Server
// Component. This awaits them first, the way the RSC payload reaches the
// browser: a component that rejected becomes one that throws where it stood,
// so the nearest client error boundary catches it.
export async function resolveServerTree(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) {
    return Promise.all(node.map((child: ReactNode) => resolveServerTree(child)));
  }
  if (!isValidElement(node)) {
    return node;
  }
  const element = node as ReactElement<{ children?: ReactNode }>;
  if (isAsyncComponent(element.type)) {
    const render = element.type;
    try {
      return await resolveServerTree(await render(element.props));
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      function Rejected(): never {
        throw failure;
      }
      return <Rejected />;
    }
  }
  if (element.props.children === undefined) {
    return element;
  }
  return cloneElement(element, { children: await resolveServerTree(element.props.children) });
}
