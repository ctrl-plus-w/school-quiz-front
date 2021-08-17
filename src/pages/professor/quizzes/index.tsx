import { useSelector } from 'react-redux';

import type { ReactElement } from 'react';

import React from 'react';

import ProfessorDashboard from '@layout/ProfessorDashboard';

import ProfessorDashboardSkeleton from '@layout/ProfessorDashboardSkeleton';

import Container from '@module/Container';
import Table from '@module/Table';

import { booleanMapper } from '@util/mapper.utils';

import useAuthentication from '@hooks/useAuthentication';
import useLoadQuizzes from '@hooks/useLoadQuizzes';

import { selectQuizzes } from '@redux/quizSlice';

import ROLES from '@constant/roles';
import ContainerSkeleton from '@skeleton/ContainerSkeleton';
import TableSkeleton from '@skeleton/TableSkeleton';

const ProfessorQuizzes = (): ReactElement => {
  const { state: quizzesState, run } = useLoadQuizzes();
  const { state: authState } = useAuthentication(ROLES.PROFESSOR.PERMISSION, run);

  const quizzes = useSelector(selectQuizzes);

  return authState === 'LOADING' || quizzesState === 'LOADING' ? (
    <ProfessorDashboardSkeleton>
      <ContainerSkeleton subtitle>
        <TableSkeleton
          attributes={[
            ['ID', 'id'],
            ['Title', 'title'],
            ['Slug', 'slug'],
            ['Strict', 'strict'],
            ['Mélanger les questions', 'shuffle'],
          ]}
        />
      </ContainerSkeleton>
    </ProfessorDashboardSkeleton>
  ) : (
    <ProfessorDashboard>
      <Container title="Tests" subtitle={{ name: 'Créer un test', path: '/professor/quizzes/create' }}>
        <Table<IQuiz, keyof IQuiz>
          apiName="quizzes"
          attributes={[
            ['ID', 'id'],
            ['Title', 'title'],
            ['Slug', 'slug'],
            ['Strict', 'strict', booleanMapper],
            ['Mélanger les questions', 'shuffle', booleanMapper],
          ]}
          data={quizzes || []}
        />
      </Container>
    </ProfessorDashboard>
  );
};

export default ProfessorQuizzes;
