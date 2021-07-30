import React, { FormEvent, FunctionComponent } from 'react';

interface IProps {
  full?: boolean;
  children?: React.ReactNode;
  onSubmit?: (e: FormEvent) => void;
}

const Form: FunctionComponent<IProps> = ({ children, onSubmit, full = false }: IProps) => {
  return (
    <form className={`form flex flex-col ${full ? 'w-full h-full' : 'w-80'} items-start`} onSubmit={onSubmit}>
      {children}
    </form>
  );
};

export default Form;
