import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';

import type { ReactElement } from 'react';

import React from 'react';
import clsx from 'clsx';

import ProfessorDashboardSkeleton from '@layout/ProfessorDashboardSkeleton';
import ProfessorDashboardLayout from '@layout/ProfessorDashboard';

import Container from '@module/Container';
import Table from '@module/Table';

import useLoadProfessorEvent from '@hooks/useLoadProfessorEvent';
import useAuthentication from '@hooks/useAuthentication';
import useAppSelector from '@hooks/useAppSelector';
import useAppDispatch from '@hooks/useAppDispatch';
import useLoading from '@hooks/useLoading';
import useSocket from '@hooks/useSocket';

import { generateArray } from '@util/generate.utils';

import { addUsers, clearUsers, replaceOrAddUser, selectUsers } from '@redux/userSlice';
import { selectTempQuiz, setTempQuiz } from '@redux/quizSlice';
import { selectTempEvent } from '@redux/eventSlice';
import { selectToken } from '@redux/authSlice';

import ROLES from '@constant/roles';

const Direct = (): ReactElement => {
  const dispatch = useAppDispatch();

  const { state: eventState, run: runEvent } = useLoadProfessorEvent();
  const { state: authState } = useAuthentication(ROLES.PROFESSOR.PERMISSION, [runEvent]);

  const { loading } = useLoading([authState, eventState]);

  const token = useAppSelector(selectToken);
  const event = useAppSelector(selectTempEvent);
  const quiz = useAppSelector(selectTempQuiz);
  const users = useAppSelector(selectUsers);

  const socket = useSocket(token);

  useEffect(() => {
    if (!event) return;

    dispatch(clearUsers());

    if (event.quiz) dispatch(setTempQuiz(event.quiz));
    if (event.users) dispatch(addUsers(event.users));
  }, [event]);

  const stateMapper = (state?: IState): ReactElement => {
    if (state && state.slug === 'actif') return <span className="bg-green-600 text-white py-1 px-4 rounded">{state.name}</span>;
    if (state && state.slug === 'pret') return <span className="bg-yellow-600 text-white py-1 px-4 rounded">{state.name}</span>;

    return <span className="bg-red-600 text-white py-1 px-4 rounded">{'Inactif'}</span>;
  };

  const warnMapper = (warns?: Array<IWarn>): ReactElement => {
    const amount = warns && warns[0] ? Math.min(warns[0].amount, 3) : 0;

    return (
      <div className="flex gap-2">
        {generateArray(amount, 0).map((_, index) => (
          <div className={clsx(['w-4 h-4 rounded-full', index < 2 && 'bg-yellow-500', index === 2 && 'bg-red-600'])} key={uuidv4()}></div>
        ))}

        {generateArray(3 - amount, 0).map(() => (
          <div className="w-4 h-4 bg-gray-400 rounded-full" key={uuidv4()}></div>
        ))}
      </div>
    );
  };

  // Socket io user:events
  useEffect(() => {
    if (!socket) return;

    socket.on('user:update', (user: IUser) => {
      dispatch(replaceOrAddUser(user));
    });

    socket.on('user:warn', (userId: number, amount: number) => {
      const user = users.find(({ id }) => id === userId);
      if (!user) return;

      dispatch(replaceOrAddUser({ ...user, eventWarns: [{ amount }] }));
    });
  }, [socket, users]);

  // Socket io join:event
  useEffect(() => {
    if (!event || !socket) return;

    socket.emit('user:join');
  }, [socket, event]);

  if (loading) return <ProfessorDashboardSkeleton></ProfessorDashboardSkeleton>;

  if (!event || !quiz)
    return (
      <ProfessorDashboardLayout>
        <div className="flex flex-col m-auto">
          <h1>Aucun événement trouvé.</h1>
        </div>
      </ProfessorDashboardLayout>
    );

  return (
    <ProfessorDashboardLayout>
      <Container title="Test en direct" subtitle={quiz.title}>
        <Table
          data={[...users].sort((a, b) => a.id - b.id)}
          attributes={[
            ["Nom d'utilisateur", 'username'],
            ['Nom', 'lastName'],
            ['État', 'state', stateMapper],
            ['Alertes', 'eventWarns', warnMapper],
          ]}
          handleClick={() => null}
        />
      </Container>
    </ProfessorDashboardLayout>
  );
};

export default Direct;
