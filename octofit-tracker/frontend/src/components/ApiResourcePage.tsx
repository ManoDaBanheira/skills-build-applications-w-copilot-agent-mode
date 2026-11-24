import { useEffect, useState, type ReactNode } from 'react';

type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; items: T[] };

type Props<T> = {
  title: string;
  description: string;
  emptyMessage: string;
  load: () => Promise<T[]>;
  getKey: (item: T, index: number) => string;
  renderItem: (item: T) => ReactNode;
};

export function ApiResourcePage<T>({ title, description, emptyMessage, load, getKey, renderItem }: Props<T>) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load().then(
      (items) => {
        if (active) setState({ status: 'success', items });
      },
      (error: unknown) => {
        if (!active) return;
        const detail = error instanceof Error ? `: ${error.message}` : '';
        setState({ status: 'error', message: `Unable to load ${title.toLowerCase()}${detail}` });
      },
    );
    return () => {
      active = false;
    };
  }, [load, title]);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state.status === 'error' && <p role="alert">{state.message}</p>}
        {state.status === 'success' && (state.items.length === 0
          ? <p>{emptyMessage}</p>
          : <ul className="list-group">{state.items.map((item, index) => <li className="list-group-item" key={getKey(item, index)}>{renderItem(item)}</li>)}</ul>)}
      </div>
    </section>
  );
}
