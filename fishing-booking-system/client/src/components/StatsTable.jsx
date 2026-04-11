import React from 'react';
import TopFishermen from './TopFishermen';
import TopVisitors from './TopVisitors';

const StatsTable = ({ user }) => {
  return (
    <div>
      <TopFishermen user={user} />
      <TopVisitors user={user} />
    </div>
  );
};

export default StatsTable;