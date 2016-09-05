// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone.localStorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

	//Todo Model
	var Todo = Backbone.Model.extend({
		//设置默认属性
		defaults: function() {
			return {
				title: "empty todo...",
				order: Todos.nextOrder(),
				done: false
			};
		},
		//设置任务完成状态
		toggle: function() {
			this.save({done: !this.get("done")});
		}
	});

	//Todo collection
	var TodoList = Backbone.Collection.extend({
		model: Todo,
		//存储到浏览器以todos-backbone命名的空间中
		localStorage: new Backbone.LocalStorage("todos-backbone"),
		//获取所有已经完成的任务数组
		done: function() {
			return this.where({done: true});
		},
		//获取任务列表中未完成的任务数组
		remaining: function() {
			return this.where({done: false});
		},
		//获得下一个任务的排序序号
		nextOrder: function() {
			if(!this.length) return 1;
			return this.last().get('order') + 1;
		},
		//内置属性，指明collection的排序规则
		comparator: 'order'
	});

	var Todos = new TodoList;

	//Todo item view
	var TodoView = Backbone.View.extend({
		tagName: "li",
		template: _.template($('#item-template').html()),
		events: {
			"click .toggle": "toggleDone",
			"dblclick .view": "edit",
			"click a.destroy": "clear",
			"keypress .edit": "updateOnEnter",
			"blur .edit": "close"
		},
		//在初始化时设置对model的change事件和destroy事件监听
		initialize: function() {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},
		//渲染todo中的数据到item-template
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));//jQuery
			this.$el.toggleClass('done', this.model.get('done'));
			this.input = this.$('.edit');
			return this;
		},
		//控制任务完成或者未完成
		toggleDone: function() {
			this.model.toggle();
		},
		//修改任务条目的样式
		edit: function() {
			$(this.el).addClass('editing');//native DOM element
			this.input.focus();
		},
		//移除对应条目，以及对应的数据对象
		clear: function() {
			this.model.destroy();
		},
		//按下回车之后，关闭编辑模式
		updateOnEnter: function(e) {
			if (e.keyCode == 14) this.close();
		},
		//关闭编辑模式，并把修改内容同步到Model和界面
		close: function() {
			var value = this.input.val();
			if (!value) {
				this.clear();
			} else {
				this.model.save({title: value});
				this.$el.removeClass("editing");
			}
		}
	});

	//AppView
	var AppView = Backbone.View.extend({
		el: $("#todoapp"),
		statsTemplate: _.template($('#stats-template').html()),
		events: {
			"keypress #new-todo": "createOnEnter",
			"click #clear-completed": "clearCompleted",
			"click #toggle-all": "toggleAllComplete"
		},
		initialize: function() {
			this.input = this.$('#new-todo');
			this.allCheckbox = this.$('#toggle-all')[0];

			this.listenTo(Todos, 'add', this.addOne);
			this.listenTo(Todos, 'reset', this.addAll);
			this.listenTo(Todos, 'all', this.render);

			this.footer = this.$('footer');
			this.main = $('#main');

			Todos.fetch();
		},
		render: function() {
			var done = Todos.done().length;
			var remaining = Todos.remaining().length;

			if (Todos.length) {
				this.main.show();
				this.footer.show();
				this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
			} else {
				this.main.hide();
				this.footer.hide();
			}
			this.allCheckbox.checked = !remaining;	
		},
		addOne: function(todo) {
			var view = new TodoView({model: todo});
			this.$("#todo-list").append(view.render().el);
		},
		addAll: function() {
			Todos.each(this.addOne, this);
		},
		createOnEnter: function(e) {
			if (e.keyCode != 13) return;
			if (!this.input.val()) return;
			Todos.create({title: this.input.val()});
			this.input.val('');
		},
		clearCompleted: function() {
			_.invoke(Todos.done(), 'destroy');
			return false;
		},
		toggleAllComplete: function() {
			var done = this.allCheckbox.checked;
			Todos.each(function(todo) {
				todo.save({'done': done});
			});
		}
	});

	var App = new AppView;
});