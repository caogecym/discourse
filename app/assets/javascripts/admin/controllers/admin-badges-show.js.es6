import BufferedContent from 'discourse/mixins/buffered-content';

export default Ember.ObjectController.extend(BufferedContent, {
  needs: ['admin-badges'],
  saving: false,
  savingStatus: '',

  badgeTypes: Em.computed.alias('controllers.admin-badges.badgeTypes'),
  badgeGroupings: Em.computed.alias('controllers.admin-badges.badgeGroupings'),
  badgeTriggers: Em.computed.alias('controllers.admin-badges.badgeTriggers'),
  protectedSystemFields: Em.computed.alias('controllers.admin-badges.protectedSystemFields'),

  readOnly: Ember.computed.alias('buffered.system'),
  showDisplayName: Discourse.computed.propertyNotEqual('name', 'displayName'),
  canEditDescription: Em.computed.none('buffered.translatedDescription'),

  _resetSaving: function() {
    this.set('saving', false);
    this.set('savingStatus', '');
  }.observes('model.id'),

  actions: {
    save: function() {
      if (!this.get('saving')) {
        var fields = ['allow_title', 'multiple_grant',
                     'listable', 'auto_revoke',
                     'enabled', 'show_posts',
                     'target_posts', 'name', 'description',
                     'icon', 'query', 'badge_grouping_id',
                     'trigger', 'badge_type_id'],
            self = this;

        if (this.get('buffered.system')){
          var protectedFields = this.get('protectedSystemFields');
          fields = _.filter(fields, function(f){
            return !_.include(protectedFields,f);
          });
        }

        this.set('saving', true);
        this.set('savingStatus', I18n.t('saving'));

        var boolFields = ['allow_title', 'multiple_grant',
                          'listable', 'auto_revoke',
                          'enabled', 'show_posts',
                          'target_posts' ];

        var data = {},
            buffered = this.get('buffered');
        fields.forEach(function(field){
          var d = buffered.get(field);
          if (_.include(boolFields, field)) { d = !!d; }
          data[field] = d;
        });

        var newBadge = !this.get('id'),
            model = this.get('model');
        this.get('model').save(data).then(function() {
          if (newBadge) {
            self.get('controllers.admin-badges').pushObject(model);
            self.transitionToRoute('adminBadges.show', model.get('id'));
          } else {
            self.commitBuffer();
            self.set('savingStatus', I18n.t('saved'));
          }

        }).catch(function(error) {
          self.set('savingStatus', I18n.t('failed'));
          self.send('saveError', error);
        }).finally(function() {
          self.set('saving', false);
        });
      }
    },

    destroy: function() {
      var self = this,
          adminBadgesController = this.get('controllers.admin-badges'),
          model = this.get('model');

      if (!model.get('id')) {
        self.transitionToRoute('adminBadges.index');
        return;
      }

      return bootbox.confirm(I18n.t("admin.badges.delete_confirm"), I18n.t("no_value"), I18n.t("yes_value"), function(result) {
        if (result) {
          model.destroy().then(function() {
            adminBadgesController.removeObject(model);
            self.transitionToRoute('adminBadges.index');
          }).catch(function() {
            bootbox.alert(I18n.t('generic_error'));
          });
        }
      });
    }
  }
});
