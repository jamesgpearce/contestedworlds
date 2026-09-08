import type { ComponentProps } from 'react';

export const Input = ({
  className = '',
  ...props
}: ComponentProps<'input'>) => (
  <input data-slot="input" className={className} {...props} />
);
