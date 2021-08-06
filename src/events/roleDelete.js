'use strict';

const { Actions, handleRoleChange } = require('../handlers/protection');

module.exports = (client, role) => {
  handleRoleChange({ actionType: Actions.Deleted, role });
};
