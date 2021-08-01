import React, { FunctionComponent, useContext, useEffect } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';

import AdminDashboardModelsLayout from '@layout/AdminDashboardModels';

import Table from '@module/Table';

import { getHeaders } from '@util/authentication.utils';

import ROLES from '@constant/roles';

import { AuthContext } from 'context/AuthContext/AuthContext';

import database from 'database/database';

interface ServerSideProps {
  roles: Array<Role>;
  token: string;
}

const AdminRolesDashboard: FunctionComponent<ServerSideProps> = ({ roles, token }: ServerSideProps) => {
  const { setToken } = useContext(AuthContext);

  useEffect(() => setToken(token), []);

  return (
    <AdminDashboardModelsLayout title="Rôles" subtitle="Créer un état">
      <Table<Role, keyof Role>
        attributes={[
          ['ID', 'id'],
          ['Nom', 'name'],
          ['Permission', 'permission'],
          ['Slug', 'slug'],
        ]}
        data={roles}
        apiName="roles"
      />
    </AdminDashboardModelsLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  try {
    const token = context.req.cookies.user;
    if (!token) throw new Error();

    const { data: validatedTokenData } = await database.post('/auth/validateToken', {}, getHeaders(token));
    if (!validatedTokenData.valid) throw new Error();

    if (validatedTokenData.rolePermission !== ROLES.ADMIN.PERMISSION) throw new Error();

    const { data: roles } = await database.get('/api/roles', getHeaders(token));
    if (!roles) throw new Error();

    const props: ServerSideProps = { roles, token };

    return { props };
  } catch (err) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
};

export default AdminRolesDashboard;
