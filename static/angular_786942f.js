angular.module('ExpensePlannerApp', [])

.config([
    '$compileProvider',
    function ($compileProvider) {
        $compileProvider.debugInfoEnabled(false)
        $compileProvider.commentDirectivesEnabled(false);
        $compileProvider.cssClassDirectivesEnabled(false);
    }
])

.factory('ConfigService', [
    function () {
        var configKey = 'expense-planner-v1'

        function load () {
            var data = localStorage.getItem(configKey)
            if (data) {
                try {
                    data = JSON.parse(data)
                }
                catch (e) {}
            }

            return data
        }

        function save (data) {
            data = JSON.stringify(data)
            localStorage.setItem(configKey, data)
        }

        function purge () {
            localStorage.removeItem(configKey)
        }

        return {
            load: load,
            save: save,
            purge: purge,
        }
    }
])

.controller('ExpenseController', [
    'ConfigService',
    function (ConfigService) {
        var vm = this
        var configKeys = [
            'friendsList',
            'expensesList',
        ]

        vm.friendsList = []
        vm.addFriend = vmAddFriend
        vm.removeFriend = vmRemoveFriend
        vm.addFriendForm = {
            name: '',
        }

        vm.expensesList = []
        vm.addExpense = vmAddExpense
        vm.removeExpense = vmRemoveExpense
        vm.saveExpense = vmSaveExpense

        var defaultExpense = {
            desc: '',
            payTo: '',
            price: 0,
            adjust: 0,
            from: {},
        }

        vm.calculate = vmCalculate
        vm.calculateData = []

        vm.modifyRawData = vmModifyRawData

        vmInit()

        // =====

        function vmInit () {
            var data = ConfigService.load()

            if (data) {
                angular.forEach(configKeys, function (k) {
                    if (k in data && k in vm) {
                        vm[k] = data[k]
                    }
                })
            }

            if (vm.expensesList.length == 0) {
                vm.addExpense()
            }

            var navLinks = document.querySelectorAll('.nav-link')
            angular.forEach(navLinks, function (item) {
                item.addEventListener('click', function (e) {
                    e.preventDefault()

                    document.querySelector('.nav-link.active').classList.remove('active')
                    item.classList.add('active')

                    var target = item.getAttribute('href')
                    document.querySelector('.tab-pane.active').classList.remove('active')
                    document.querySelector(target).classList.add('active')
                }, false)
            })

        }

        function saveData () {
            var data = {}

            angular.forEach(configKeys, function (k) {
                data[k] = vm[k]
            })

            ConfigService.save(data)
        }

        // =====

        function vmAddFriend (form) {
            if (form.$valid) {
                vm.friendsList.push(vm.addFriendForm.name)
                vm.addFriendForm.name = ''

                saveData()
            }
        }

        function vmRemoveFriend (index) {
            var friendName = vm.friendsList[index]
            var result = window.confirm('Delete "' + friendName + '" from friend list?')

            if (result) {
                vm.friendsList.splice(index, 1)
                saveData()
            }
        }

        // =====

        function vmAddExpense () {
            var copyExpense = angular.copy(defaultExpense)

            if (vm.friendsList.length > 0) {
                copyExpense.payTo = vm.friendsList[0]
            }

            vm.expensesList.push(copyExpense)
        }

        function vmRemoveExpense (index) {
            var result = window.confirm('Delete from expenses list?')

            if (result) {
                vm.expensesList.splice(index, 1)
                saveData()
            }
        }

        function vmSaveExpense () {
            saveData()
        }

        // =====

        function vmCalculate () {
            var crossIndex = {}
            var glue = '__xx' + Date.now() + 'xx__'

            angular.forEach(vm.friendsList, function (parentName) {
                angular.forEach(vm.friendsList, function (childName) {
                    if (parentName != childName) {
                        crossIndex[parentName + glue + childName] = 0
                    }
                })
            })

            angular.forEach(vm.expensesList, function (exp) {
                var amount = Number(exp.price) + Number(exp.adjust)
                var checkedPerson = []

                for (var key in exp.from) {
                    if (exp.from[key].selected && vm.friendsList.indexOf(key) !== -1) {
                        checkedPerson.push(key)
                    }
                }

                if (checkedPerson.length > 0) {
                    amount /= checkedPerson.length

                    var childName = exp.payTo
                    angular.forEach(checkedPerson, function (parentName) {
                        if (parentName != childName) {
                            crossIndex[parentName + glue + childName] += amount
                        }
                    })
                }
            })

            var processedIndex = []
            var finalData = []

            for (var key in crossIndex) {
                if (processedIndex.indexOf(key) === -1) {
                    var reverseKey = key.split(glue).reverse().join(glue)

                    var nameList = key.split(glue)
                    var diffAmount = crossIndex[key] - crossIndex[reverseKey]

                    if (diffAmount != 0) {
                        if (diffAmount < 0) {
                            nameList.reverse()
                        }

                        finalData.push({
                            from: nameList[0],
                            to: nameList[1],
                            amount: Math.abs(diffAmount),
                        })
                    }

                    processedIndex.push(key)
                    processedIndex.push(reverseKey)
                }
            }

            vm.calculateData = finalData

        }

        function vmModifyRawData (operation) {
            var textarea = document.getElementById('raw-data')

            if (operation == 'import') {
                ConfigService.save(JSON.parse(textarea.value))
                window.location.reload()
            }
            else if (operation == 'export') {
                var rawData = ConfigService.load()
                textarea.value = JSON.stringify(rawData, null, 4)
            }
            else if (operation == 'purge') {
                var result = window.confirm('Purge all data?')
                if (result) {
                    ConfigService.purge()
                    window.location.reload()
                }
            }
        }

    }
])
