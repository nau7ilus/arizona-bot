<template>
  <v-app>
    <v-row>
      <v-col class="login col-md-5 col-sm-6 pt-15" style="padding-left:3rem">
        <v-col style="padding-left:3rem">
          <div class="logo mb-15" style="padding-bottom: 7rem">
            <img alt="HamsterBot Logo" src="./assets/logo.svg" />
            <span class="logo_title"><b>HamsterBot</b> | Moderators</span>
          </div>
        </v-col>
        <v-flex class="pl-10" style="padding: 5rem 14rem">
          <div>
            <h2 class="login_title pb-6">Авторизация</h2>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Электронная почта"
                placeholder=" "
                style="margin-bottom:1rem"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                :rules="passwordRules"
                placeholder=" "
                label="Пароль"
                type="password"
                required
              ></v-text-field>

              <div class="center">
                <v-checkbox
                  style="font-size:1px !important"
                  v-model="checkbox"
                  label="Запомнить меня"
                  required
                ></v-checkbox>
                <v-spacer></v-spacer>
                <a style="color: #fff; font-size: .9rem" href="#">Забыли пароль?</a>
              </div>

              <v-btn block class="mb-3" color="white" height="50" rounded style="color: #ff991c; font-size:1.2rem;"
                >Вход</v-btn
              >
              <v-btn block color="#ffb357" height="50" rounded style="color: white; font-size:1.2rem;"
                >Регистрация</v-btn
              >
              <!-- <v-btn :disabled="!valid" color="success" class="mr-4" @click="validate">
                Validate
              </v-btn>

              <v-btn color="error" class="mr-4" @click="reset">
                Reset Form
              </v-btn>

              <v-btn color="warning" @click="resetValidation">
                Reset Validation
              </v-btn> -->
            </v-form>
          </div>
        </v-flex>
      </v-col>
      <v-col class="other-platforms">
        <p>dsf</p>
      </v-col>
    </v-row>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
    valid: true,
    password: '',
    nameRules: [v => !!v || 'Name is required', v => (v && v.length <= 8) || 'Name must be less than 8 characters'],
    email: '',
    emailRules: [v => !!v || 'E-mail is required', v => /.+@.+\..+/.test(v) || 'E-mail must be valid'],
    checkbox: false,
  }),

  methods: {
    validate() {
      this.$refs.form.validate();
    },
    reset() {
      this.$refs.form.reset();
    },
    resetValidation() {
      this.$refs.form.resetValidation();
    },
  },
};
</script>

<style lang="scss">
.v-input {
  color: #371b00 !important;
}

.v-text-field label {
  font-size: 20px !important;
}
.v-label {
  color: white !important;
}

.center {
  display: flex;
  align-items: center;
}
.login {
  background-color: #371b00;

  &_title {
    font-weight: 500;
    font-size: 2.5em;
  }
}

.other-platforms {
  // background: rgb(176, 115, 36);
  // background: linear-gradient(90deg, #582a00, #371b00);
  background-image: url('./assets/logo.png');
  background-repeat: repeat;
}

.logo {
  font-size: 1.5rem;
  display: flex;
  align-items: center;

  span {
    font-weight: 100;
  }
  b {
    font-weight: 600;
  }
  img {
    height: 1.7rem;
    padding-right: 0.5rem;
  }
}
</style>
