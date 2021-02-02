'use strict';

// eslint-disable-next-line require-await
module.exports = async (client, member) => {
  require('../handlers/moderators').handleMemberAdd(client, member);
};
