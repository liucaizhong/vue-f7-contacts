<template lang="html">
<f7-page class="workplan-list">
  <f7-navbar sliding>
    <f7-nav-left>
      <f7-link @click="onBack">
        <f7-icon v-show="!editing" icon="icon-back">
        </f7-icon>
        {{backTitle}}
      </f7-link>
    </f7-nav-left>
    <f7-nav-center>{{mainTitle}}</f7-nav-center>
    <f7-nav-right>
      <f7-link @click="onEdit" v-if="hasAuthority">{{editTitle}}</f7-link>
    </f7-nav-right>
  </f7-navbar>

  <f7-preloader v-show="loading" color="blue" size="25px" class="spinner">
  </f7-preloader>

  <!-- <f7-block>
    <f7-buttons>
      <f7-button
        tab-link="#tab-1"
        active
      >
      计划详情
      </f7-button>
      <f7-button
        tab-link="#tab-2"
      >
      完成情况
      </f7-button>
    </f7-buttons>

    <f7-tabs swipeable>
      <f7-tab id="tab-1" active>
        <work-plan
          v-for="value in types"
          :planType="value"
          :editing="editing"
          :formContent="configForm(value)"
          :planTitle="configTitle(value)"
        >
        </work-plan>
      </f7-tab>
      <f7-tab id="tab-2">
        <taskProgress>
        </taskProgress>
      </f7-tab>
    </f7-tabs>
  </f7-block> -->

  <work-plan
    v-for="value in types"
    v-show="editing"
    :planType="value"
    :editing="editing"
    :formContent="configForm(value)"
    :planTitle="configTitle(value)"
  >
  </work-plan>

  <taskProgress v-show="!editing" :userId="curUserId" :comp="comp">
  </taskProgress>

  <bottom-toolbar page="workplan-list"></bottom-toolbar>
</f7-page>
</template>

<script>
import { PLANTYPES, PLANTITLES, PLANFORMS } from '../Lib/constant.js'
import Common from '../Lib/tools.js'
import WorkPlan from '@/Component/work-plan.vue'
import TaskProgress from '@/Component/task-progress.vue'
import axios from 'axios'
import BottomToolbar from '@/Component/bottom-toolbar.vue'

export default {
  data () {
    return {
      mainTitle: '工作计划',
      loading: false,
      // dep: '',
      // emp: '',
      year: '',
      quarter: '',
      editing: false,
      // hasAuthority: true,
      curUserId: '',
      types: PLANTYPES,
      isDev: process.env.NODE_ENV === 'development',
      comp: '1',
    }
  },
  created () {
    // set current year and quarter
    let date = new Date()
    this.year = date.getFullYear()
    this.quarter = Math.floor(date.getMonth()/3)
    this.curUserId = this.$route.params.id
    console.dir(this.$route)
    // get workplan
    let url = process.env.NODE_ENV === 'production'
              ? './API/getWP.php'
              : 'http://localhost:3000/getworkplan'

    axios.get(url,{
      params: {
        userId: this.curUserId,
        year: this.year,
        quarter: this.quarter
      }
    })
    .then((response) => {
      // console.dir(response)
      let dataObj = response.data
      // console.dir(dataObj)
      this.$store.commit('initPlan', dataObj)
      this.loading = false
    })
    .catch((error) => {
      console.log(error)
    })

  },
  computed: {
    backTitle: function () {
      return this.editing ? '取消' : '返回'
    },
    editTitle: function () {
      return this.editing ? '保存' : '编辑'
    },
    hasAuthority: function () {
      let loginfo = {...this.$store.state.loginfo.userInfo}
      // console.log('loginfo is:')
      // console.dir(loginfo)
      // validate if the user has enough authority
      // 1.if the user is administrator
      if(!loginfo.role.localeCompare('0')) {
        return true
      }
      // 2.if the current date is among the valid period
      // (from the beginning of querter to the middle)
      let curDate = new Date()
      if(curDate.getMonth()%3 != 0) {
        return false
      }
      if(curDate.getDate() > 15) {
        return false
      }
      // 3.if the user is same as the user checked
      if(!this.curUserId.localeCompare(loginfo.userId)) {
        return true
      }

      return false
    },
  },
  methods: {
    onEdit () {
      let expandedAccordion = document.querySelectorAll('li.accordion-item-expanded')
      if(expandedAccordion.length) {
        let f7 = this.$f7
        f7.accordionClose(expandedAccordion)
      }
      if(this.editing) {
        // axios send request and eliminate empty object
        let workplan = Object.assign({}, this.$store.state.workplan)
        let updObj = this.types.map((cur) => {
          let willUpdPlan = workplan[cur].willUpdPlan
          let updArr = []
          willUpdPlan.forEach((val) => {
            if(!Common.isEmptyObject(val)) {
              updArr.push(val)
            }
          })
          if(updArr && updArr.length) {
            return {
              [cur]: updArr
            }
          }
        }).reduce((total, cur) => {
          return Object.assign(total, cur)
        }, {})

        let url = process.env.NODE_ENV === 'production'
                  ? './API/updateWP.php'
                  : 'http://localhost:3000/updateworkplan'

        let updData =  Object.assign({
          userId: this.curUserId,
          year: this.year,
          quarter: this.quarter,
        }, updObj)

        axios.post(url, updData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        })
        .then((response) => {
          console.log('response back!')
          // console.dir(response)
          let res = JSON.parse(response.data)
          this.$store.commit('initPlan', res)
          this.loading = false
          this.editing = !this.editing
          this.$f7.alert('更新成功！', '')
        })
        .catch((error) => {
          console.log(error)
        })
      }
      else {
        this.editing = !this.editing
      }
    },
    onBack () {
      let expandedAccordion = document.querySelectorAll('li.accordion-item-expanded')
      if(expandedAccordion.length) {
        let f7 = this.$f7
        f7.accordionClose(expandedAccordion)
      }
      if(this.editing) {
        this.editing = !this.editing
        this.$store.commit('cancelPlan')
      }
      else {
        this.$router.back()
      }
    },
    configForm (type) {
      return PLANFORMS[type]
      // switch (type) {
      //   case this.types[0]:
      //     return [{
      //       name: 'comp',
      //       desc: '公司名称'
      //     },{
      //       name: 'date',
      //       desc: '预计调研日期'
      //     },{
      //       name: 'event',
      //       desc: '预期看点'
      //     }]
      //     break
      //   case this.types[1]:
      //     return [{
      //       name: 'stock',
      //       desc: '个股名称'
      //     },{
      //       name: 'finishDate',
      //       desc: '预计完成日期'
      //     },{
      //       name: 'reportDate',
      //       desc: '预计汇报日期'
      //     }]
      //     break
      //   case this.types[2]:
      //     return [{
      //       name: 'indus',
      //       desc: '行业主题'
      //     },{
      //       name: 'finishDate',
      //       desc: '预计完成日期'
      //     },{
      //       name: 'reportDate',
      //       desc: '预计汇报日期'
      //     }]
      //     break
      // }
    },
    configTitle (type) {
      return PLANTITLES[type]
      // switch (type) {
      //   case this.types[0]:
      //     return '调研'
      //     break
      //   case this.types[1]:
      //     return '个股深度报告'
      //     break
      //   case this.types[2]:
      //     return '行业深度报告'
      //     break
      // }
    }
  },
  components: {
    workPlan: WorkPlan,
    taskProgress: TaskProgress,
    bottomToolbar: BottomToolbar,
  }
}
</script>
