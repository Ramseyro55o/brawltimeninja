import VuexPersistence from 'vuex-persist'

export default ({ store }) => {
  window.onNuxtReady(() => new VuexPersistence({
    key: `${store.state.app}-ninja`,
    reducer: state => ({
      lastPlayers: state.lastPlayers,
    }),
  }).plugin(store))
}
