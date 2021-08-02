import React, { FunctionComponent } from 'react';

import { useRouter } from 'next/dist/client/router';
import { useCookies } from 'react-cookie';

interface IProps {
  children?: React.ReactNode;
  logoutButton?: boolean;
}

const Menu: FunctionComponent<IProps> = ({ children, logoutButton = false }: IProps) => {
  const [_cookie, _setCookie, removeCookie] = useCookies(['user']);

  const router = useRouter();

  const handleClick = () => {
    removeCookie('user');
    router.push('/login');
  };

  return (
    <div className="flex flex-row justify-between w-full px-8 py-6 border-b border-gray-300">
      {children}

      {logoutButton && (
        <a className="text-black font-medium text-base mt-auto cursor-pointer" onClick={handleClick}>
          Se déconnecter
        </a>
      )}
    </div>
  );
};

export default Menu;
