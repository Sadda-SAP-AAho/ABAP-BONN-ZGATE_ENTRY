CLASS zcl_gatetimediff DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.
    INTERFACES if_sadl_exit_calc_element_read.

  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.



CLASS ZCL_GATETIMEDIFF IMPLEMENTATION.


  METHOD if_sadl_exit_calc_element_read~calculate.
    DATA: lt_GateEntryHeader TYPE STANDARD TABLE OF ZC_GateEntryHeader WITH DEFAULT KEY.
    lt_GateEntryHeader = CORRESPONDING #( it_original_data ).

    loop at lt_GateEntryHeader assigning FIELD-SYMBOL(<lfs_progressors>).
      DATA se.
      se = <lfs_progressors>-Gateouttime - <lfs_progressors>-Gateintime .
"      se = se mod 86400.

"      se = se div 60.

"      IF se <> 0.
"        <lfs_progressors>-Timedifference = se div 60.
"      ELSE.
        <lfs_progressors>-Timedifference = 321.
"      ENDIF.

    endloop.

    ct_calculated_data = CORRESPONDING #( lt_gateentryheader ).

  ENDMETHOD.


  METHOD if_sadl_exit_calc_element_read~get_calculation_info.

  ENDMETHOD.
ENDCLASS.
