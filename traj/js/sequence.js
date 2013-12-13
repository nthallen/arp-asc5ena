var cur_sequence = { curstep: 0, seq: [] };

function sequence_init(seq) {
  cur_sequence.seq = seq;
  cur_sequence.curstep = 0;
  set_status(cur_sequence.seq[0].Status);
  setTimeout(sequence_exec, 200);
}

function sequence_exec() {
  if (cur_sequence.curstep < cur_sequence.seq.length) {
    cur_sequence.seq[cur_sequence.curstep].Function();
    if (++cur_sequence.curstep >= cur_sequence.seq.length) {
      if (!cur_sequence.seq[cur_sequence.curstep-1].Async) {
        set_status("Ready");
      }
    } else {
      set_status(cur_sequence.seq[cur_sequence.curstep].Status);
      if (cur_sequence.seq[cur_sequence.curstep].Async) {
        setTimeout(cur_sequence.seq[cur_sequence.curstep].Function, 200);
      } else {
        setTimeout(sequence_exec, 200);
      }
    }
  } else {
    set_status("Ready");
  }
}
