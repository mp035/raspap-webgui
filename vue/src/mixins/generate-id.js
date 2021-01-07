export default {
  methods: {
    generateId() {
      // generates a 5 letter random string for use as a random component id when needed.
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // 0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < 5; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength),
        );
      }
      return result;
    },
  },
};
