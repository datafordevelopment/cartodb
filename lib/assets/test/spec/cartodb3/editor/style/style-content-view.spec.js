var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var UserActions = require('../../../../../javascripts/cartodb3/data/user-actions');
var StyleContentView = require('../../../../../javascripts/cartodb3/editor/style/style-content-view');
var StyleDefinitionModel = require('../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QuerySchemaModel = require('../../../../../javascripts/cartodb3/data/query-schema-model');

describe('editor/style/style-content-view', function () {
  beforeEach(function () {
    this.overlayModel = new Backbone.Model();
    this.model = new StyleDefinitionModel({
      autogenerated: true
    });
    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'unfetched'
    }, {
      configModel: {}
    });
    this.layerDefinitionModel = new Backbone.Model();
    spyOn(this.layerDefinitionModel, 'save');
    spyOn(this.querySchemaModel, 'fetch');
    spyOn(StyleContentView.prototype, 'render').and.callThrough();

    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    this.promise = $.Deferred();
    spyOn(this.userActions, 'saveLayer').and.returnValue(this.promise);

    this.view = new StyleContentView({
      configModel: {},
      userActions: this.userActions,
      layerDefinitionsCollection: new Backbone.Collection(),
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      modals: {},
      styleModel: this.model,
      overlayModel: this.overlayModel,
      freezeTorgeAggregation: jasmine.createSpy('freezeTorgeAggregation')
    });
    this.view.render();
  });

  it('should fetch query schema model if it is unfetched', function () {
    expect(this.querySchemaModel.fetch).toHaveBeenCalled();
  });

  describe('._initBinds', function () {
    it('should render when styleModel is undone or redone', function () {
      StyleContentView.prototype.render.calls.reset();
      var fill = _.clone(this.model.get('fill'));
      fill.size = 34;
      this.model.set('fill', fill);
      expect(StyleContentView.prototype.render).not.toHaveBeenCalled();
      this.model.undo();
      expect(StyleContentView.prototype.render).toHaveBeenCalled();
      this.model.redo();
      expect(StyleContentView.prototype.render.calls.count()).toBe(2);
    });

    it('should change cartocss_custom property when styleModel changes', function () {
      var fill = _.clone(this.model.get('fill'));
      fill.size = 34;
      this.model.set('fill', fill);
      expect(this.layerDefinitionModel.get('cartocss_custom')).toBe(false);
      expect(this.userActions.saveLayer).toHaveBeenCalledWith(this.layerDefinitionModel);
    });

    it('should change autogenerated property when styleModel changes', function () {
      var fill = _.clone(this.model.get('fill'));
      fill.size = 34;
      this.model.set('fill', fill);
      expect(this.model.get('autogenerated')).toBeFalsy();
    });
  });

  describe('.render', function () {
    it('should render "placeholder" if state is loading', function () {
      this.view.modelView.set({state: 'loading'});
      expect(this.view.$('.FormPlaceholder-paragraph').length).toBe(4);
      expect(_.size(this.view._subviews)).toBe(0);
    });

    it('should render properly when state is ready and query schema is fetched', function () {
      this.view.modelView.set({state: 'ready'});
      this.querySchemaModel.set('status', 'fetched');
      this.view.render();
      expect(this.view.$('.Carousel').length).toBe(1);
      expect(this.view.$('.Editor-HeaderInfo').length).toBe(2);
      expect(_.size(this.view._subviews)).toBe(3); // overlay counts
    });

    it('should not render carousel view when geometry is not point', function () {
      spyOn(this.view, '_getCurrentSimpleGeometryType').and.returnValue('polygon');
      this.view.modelView.set({state: 'ready'});
      this.querySchemaModel.set('status', 'fetched');
      this.view.render();
      expect(this.view.$('.Carousel').length).toBe(0);
      expect(this.view.$('.Editor-HeaderInfo').length).toBe(1);
      expect(_.size(this.view._subviews)).toBe(2);
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
