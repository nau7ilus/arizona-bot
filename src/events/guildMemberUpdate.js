'use strict';

module.exports = (client, oldMember, newMember) => {
  require('../handlers/protection').handleMemberUpdate(oldMember, newMember);
};
