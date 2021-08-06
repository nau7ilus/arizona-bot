'use strict';

const { Actions, handleRoleChange } = require('../handlers/protection');

module.exports = (client, oldRole, newRole) => {
  handleRoleChange({ actionType: Actions.Updated, oldRole, newRole });
};
