import { FormEvent, FunctionComponent, useEffect, useState } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/dist/client/router';

import React from 'react';

import AdminDashboardModelLayout from '@layout/AdminDashboardModel';

import FormGroup from '@module/FormGroup';
import Row from '@module/Row';

import PasswordInput from '@element/PasswordInput';
import TagsInput from '@element/TagsInput';
import Dropdown from '@element/Dropdown';
import Input from '@element/Input';
import Title from '@element/Title';

import { idNameSlugMapper, stringifyGender } from '@util/mapper.utils';
import { areArraysEquals } from '@util/condition.utils';
import { getHeaders } from '@util/authentication.utils';

import database from '@database/database';

import useAppDispatch from '@hooks/useAppDispatch';

import { addInfoNotification } from '@redux/notificationSlice';

import ROLES from '@constant/roles';

type ServerSideProps = {
  user: IUser;
  groups: Array<IGroup>;
  roles: Array<IRole>;
  token: string;
};

const User: FunctionComponent<ServerSideProps> = ({ user, groups, roles, token }: ServerSideProps) => {
  const router = useRouter();

  const dispatch = useAppDispatch();

  const [valid, setValid] = useState(false);

  const [username, setUsername] = useState(user.username);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [password, setPassword] = useState('');

  const [gender, setGender] = useState(stringifyGender(user.gender));
  const [roleSlug, setRoleSlug] = useState(user.role?.slug || null);
  const [userGroups, setUserGroups] = useState<Array<IBasicModel>>(user.groups.map(idNameSlugMapper));

  useEffect(() => {
    if (
      password !== '' ||
      username !== user.username ||
      firstName !== user.firstName ||
      lastName !== user.lastName ||
      roleSlug !== (user.role?.slug || null) ||
      stringifyGender(user.gender) !== gender ||
      !areArraysEquals(userGroups, user.groups.map(idNameSlugMapper))
    ) {
      setValid(true);
    } else {
      setValid(false);
    }
  }, [username, firstName, lastName, password, gender, roleSlug, userGroups]);

  const addGroup = (group: IBasicModel): void => {
    setUserGroups((prev) => [...prev, group]);
  };

  const removeGroup = (group: IBasicModel): void => {
    setUserGroups((prev) => prev.filter((_group) => _group !== group));
  };

  const getRoleDropdownValues = (): DropdownValues => {
    return roles.map(({ name, slug }: IRole) => ({ name, slug }));
  };

  const getGenderDropdownValues = (): DropdownValues => {
    return [
      { name: 'Homme', slug: 'male' },
      { name: 'Femme', slug: 'female' },
      { name: 'Indéfini', slug: 'undefined' },
    ];
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (!user.role || roleSlug !== user.role.slug) {
        const role = roles.find(({ slug }: IRole) => slug === roleSlug);
        if (role) await database.put(`/api/users/${user.id}/role`, { roleId: role.id }, getHeaders(token));
      }

      if (userGroups !== user.groups) {
        const oldGroups = user.groups.filter((group) => !userGroups.some((_group) => _group.slug === group.slug));
        const oldGroupIds = oldGroups.map(({ id }) => id);

        if (oldGroupIds.length > 0) {
          for (const oldGroupId of oldGroupIds) {
            await database.delete(`/api/users/${user.id}/groups/${oldGroupId}`, getHeaders(token));
          }
        }

        const newGroups = userGroups.filter((group) => !user.groups.some((_group) => _group.slug === group.slug));
        const newGroupIds = newGroups.map(({ id }) => id);

        if (newGroupIds.length > 0) {
          await database.post(`/api/users/${user.id}/groups`, { groupIds: newGroupIds }, getHeaders(token));
        }
      }

      const booleanGender = gender === 'undefined' ? null : gender === 'male' ? true : false;

      const requestBody = {
        username: username !== user.username ? username : undefined,
        firstName: firstName !== user.firstName ? firstName : undefined,
        lastName: lastName !== user.lastName ? lastName : undefined,
        password: password !== '' ? password : undefined,
        gender: booleanGender !== user.gender ? booleanGender : undefined,
      };

      if (Object.values(requestBody).some((value) => value !== undefined)) {
        await database.put(`/api/users/${user.id}`, requestBody, getHeaders(token));
      }

      dispatch(addInfoNotification('Utilisateur modifié.'));
      router.push('/admin/users');
    } catch (err: any) {
      if (err.response && err.response.status === 403) return router.push('/login');
    }
  };

  return (
    <AdminDashboardModelLayout title="Modifier un utilisateur" type="edit" onSubmit={handleSubmit} valid={valid}>
      <Row>
        <FormGroup>
          <Title level={2}>Informations générales</Title>

          <Input label="Nom d'utilisateur" placeholder="johndoe" value={username} setValue={setUsername} />
          <Input label="Prénom" placeholder="John" value={firstName} setValue={setFirstName} />
          <Input label="Nom de famille" placeholder="Doe" value={lastName} setValue={setLastName} />

          <PasswordInput
            label="Mot de passe"
            placeholder="*****"
            value={password}
            setValue={setPassword}
            note="Le mot de passe doit faire au minimum 5 charactères"
            generator={true}
          />

          <Dropdown label="Sexe" placeholder="Indéfini" values={getGenderDropdownValues()} value={gender} setValue={setGender} />
        </FormGroup>

        <FormGroup>
          <Title level={2}>Informations supplémentaires</Title>

          <Dropdown label="Role" placeholder="Role" values={getRoleDropdownValues()} value={roleSlug} setValue={setRoleSlug} />

          <TagsInput
            label="Groupes"
            placeholder="Groupes"
            data={groups}
            values={userGroups}
            addValue={addGroup}
            removeValue={removeGroup}
            errorMessage="Aucun groupe trouvé..."
          />
        </FormGroup>
      </Row>
    </AdminDashboardModelLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const token = context.req.cookies.user;

  try {
    if (!token) throw new Error();

    const { data: validatedTokenData } = await database.post('/auth/validateToken', {}, getHeaders(token));
    if (!validatedTokenData.valid) throw new Error();

    if (validatedTokenData.rolePermission !== ROLES.ADMIN.PERMISSION) throw new Error();
  } catch (err) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    const { data: user } = await database.get(`/api/users/${context.query.id}`, getHeaders(token));
    if (!user) throw new Error();

    const { data: groups } = await database.get('/api/groups', getHeaders(token));
    if (!groups) throw new Error();

    const { data: roles } = await database.get('/api/roles', getHeaders(token));
    if (!roles) throw new Error();

    const props: ServerSideProps = { user, groups, roles, token };

    return { props };
  } catch (err) {
    return {
      redirect: {
        destination: '/admin/users',
        permanent: false,
      },
    };
  }
};

export default User;
