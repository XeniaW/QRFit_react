import React from 'react';
import { Redirect } from 'react-router';
import { useAuth } from './auth';

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { loggedIn } = useAuth();

  if (!loggedIn) {
    return <Redirect to="/" />;
  }

  return children;
};

export default PrivateRoute;
